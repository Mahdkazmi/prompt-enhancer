import { CONFIG } from "./config.js";
import { SYSTEM_PROMPT, buildUserMessage, extractImproved } from "./prompts.js";

// Add "Enhance prompt" to the right-click menu, only on text boxes
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "enhance-prompt",
    title: "Enhance prompt",
    contexts: ["editable"]
  });
});

// Right-click trigger
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "enhance-prompt") enhancePrompt(tab.id);
});

// Keyboard shortcut trigger
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "enhance-prompt") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) enhancePrompt(tab.id);
});

// Full flow: read the box -> ask the model -> (for now) log the result
async function enhancePrompt(tabId) {
  const text = await grabText(tabId);
  if (text === null) return; // grabText already told the user why
  if (!text.trim()) {
    showMessage(tabId, "The text box is empty. Type a prompt first.");
    return;
  }
  try {
    console.log("Sending to model…");
    const improved = await rewriteWithModel(text);
    console.log("Improved prompt:\n" + improved);
  } catch (err) {
    console.error("Enhance failed:", err.message);
    showMessage(tabId, err.message);
  }
}

// Runs inside the page and reads the box you're typing in
async function grabText(tabId) {
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const el = document.activeElement;
        // Never read passwords, even if the user triggers us inside one
        const isPassword = el?.tagName === "INPUT" && el.type === "password";
        let text = null;
        if (el && !isPassword) {
          if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") text = el.value;
          else if (el.isContentEditable) text = el.innerText; // ChatGPT, Claude, Gemini use this
        }
        // Tell the user directly; they won't be looking at the service worker console
        if (text === null) alert("Prompt Enhancer: click into a text box first.");
        return text;
      }
    });
    const text = result?.result ?? null;
    if (text === null) console.warn("No readable text box was focused.");
    else console.log("Grabbed text:", text);
    return text;
  } catch (err) {
    // Extensions aren't allowed into opera://, chrome://, store or new-tab pages
    console.error("Can't read this page:", err.message);
    return null;
  }
}

// Sends the prompt to the configured provider and returns the rewritten version
async function rewriteWithModel(text) {
  const stored = await chrome.storage.local.get(CONFIG.apiKeyStorageName);
  const apiKey = stored[CONFIG.apiKeyStorageName];
  if (!apiKey) throw new Error("No API key saved. Open the extension's options page and add your Groq key.");

  const response = await fetch(CONFIG.endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: CONFIG.model,
      temperature: CONFIG.temperature,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage(text) }
      ]
    })
  });

  if (!response.ok) {
    // Groq explains what went wrong in the body (bad key, rate limit, unknown model…)
    const details = await response.text();
    console.error("Provider error body:", details);
    const hint = response.status === 401 ? " Check your API key on the options page." : "";
    throw new Error(`The model request failed (HTTP ${response.status}).${hint}`);
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content ?? "";
  const improved = extractImproved(reply);
  if (!improved) throw new Error("The model returned an empty answer. Try again.");
  return improved;
}

// Shows a simple popup in the page (crude; the preview UI in step 6 replaces it)
function showMessage(tabId, message) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: (msg) => alert("Prompt Enhancer: " + msg),
    args: [message]
  }).catch((err) => console.error("Couldn't show message:", err.message));
}
