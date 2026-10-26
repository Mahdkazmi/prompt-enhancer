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
  if (info.menuItemId === "enhance-prompt") grabText(tab.id);
});

// Keyboard shortcut trigger
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "enhance-prompt") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) grabText(tab.id);
});

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