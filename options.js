const keyInput = document.getElementById("apiKey");
const status = document.getElementById("status");

function showStatus(message, kind) {
  status.textContent = message;
  status.className = kind;
}

// Fill the box with the saved key, so you can see one is already set
chrome.storage.local.get("groqApiKey").then(({ groqApiKey }) => {
  if (groqApiKey) keyInput.value = groqApiKey;
});

document.getElementById("showKey").addEventListener("change", (e) => {
  keyInput.type = e.target.checked ? "text" : "password";
});

document.getElementById("save").addEventListener("click", async () => {
  // Pasted keys often carry a stray space or newline, which Groq would reject
  const key = keyInput.value.trim();
  if (!key) {
    showStatus("Paste a key first.", "error");
    return;
  }
  try {
    await chrome.storage.local.set({ groqApiKey: key });
    // Saved anyway, but warn: a typo here would only show up later as a failed API call
    if (!key.startsWith("gsk_")) showStatus("Saved, but Groq keys usually start with gsk_ — double-check it.", "error");
    // Tell new users what to do next, since this is where installing leaves them
    else showStatus("Saved ✓ You're all set: click the round P button on ChatGPT, Claude or Gemini, or press Alt+Shift+E in any text box.", "ok");
  } catch (err) {
    showStatus("Couldn't save: " + err.message, "error");
  }
});
