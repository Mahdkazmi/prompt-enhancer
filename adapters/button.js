// Shared "Enhance" button for site adapters. The site's adapter file (loaded first)
// says where the chat box is; this file draws the button and keeps it in place.
// Wrapped in a function so our variables don't leak into other scripts.
(() => {
  const adapter = globalThis.__promptEnhancerAdapter;
  if (!adapter) {
    console.error("Prompt Enhancer: no site adapter loaded before button.js");
    return;
  }

  const host = document.createElement("div");
  host.id = "prompt-enhancer-button";
  host.style.cssText = "position: fixed; z-index: 2147483646; display: none;";
  // Shadow DOM so the site's CSS can't restyle the button (same idea as panel.js)
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      button {
        font: 500 12px/1 system-ui, sans-serif; padding: 6px 10px; cursor: pointer;
        border: 1px solid rgba(0, 0, 0, 0.15); border-radius: 999px;
        background: #fff; color: #333; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
      }
      button:hover { background: #f2f2f2; }
      @media (prefers-color-scheme: dark) {
        button { background: #2c2c2c; color: #eee; border-color: #555; }
        button:hover { background: #3a3a3a; }
      }
    </style>
    <button title="Enhance prompt (Alt+Shift+E)">✨ Enhance</button>`;
  document.documentElement.appendChild(host);

  const button = shadow.querySelector("button");
  // Clicking would normally move focus onto our button, and then the enhancer
  // couldn't tell which box to read. Cancelling mousedown keeps focus in the chat box.
  button.addEventListener("mousedown", (e) => e.preventDefault());
  button.addEventListener("click", async () => {
    // Also covers the case where the user never clicked into the box
    adapter.findBox()?.focus();
    try {
      await chrome.runtime.sendMessage({ type: "enhance" });
    } catch (err) {
      // After the extension is reloaded, buttons on already-open tabs lose their connection
      console.error("Prompt Enhancer:", err.message);
      alert("Prompt Enhancer was updated or reloaded. Refresh this page to use the button.");
    }
  });

  // Puts the button just above the chat box's top-right corner, or hides it if there's no box
  function place() {
    // Sites redraw large parts of the page on navigation and can throw our button away; put it back
    if (!host.isConnected) document.documentElement.appendChild(host);
    const box = adapter.findBox();
    const rect = box ? adapter.findContainer(box).getBoundingClientRect() : null;
    if (!rect || rect.width === 0) {
      host.style.display = "none";
      return;
    }
    host.style.display = "block"; // must be visible before we can measure the button
    host.style.left = `${rect.right - host.offsetWidth}px`;
    host.style.top = `${rect.top - host.offsetHeight - 6}px`;
  }

  // Chat sites swap, move and resize their box all the time (new chat, long prompts,
  // page navigation without reloads), so re-check a few times a second
  setInterval(place, 300);
  window.addEventListener("resize", place);
  window.addEventListener("scroll", place, true);
  place();
})();
