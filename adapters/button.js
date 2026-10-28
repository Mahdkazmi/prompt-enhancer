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
  // A round logo by default; hovering slides out an "Enhance" label so first-time
  // users can tell what it does. The label sits on the left and grows leftward,
  // so the logo never moves out from under the cursor.
  shadow.innerHTML = `
    <style>
      button {
        display: flex; flex-direction: row-reverse; align-items: center;
        height: 30px; padding: 0; cursor: pointer; overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 999px;
        background: #1b1b1d; /* matches the logo's background */
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
      }
      img { width: 28px; height: 28px; border-radius: 50%; flex: none; display: block; }
      .label {
        max-width: 0; opacity: 0; white-space: nowrap;
        font: 500 12px/1 system-ui, sans-serif; color: #e6e6e8;
        transition: max-width 0.2s ease, opacity 0.2s ease, padding 0.2s ease;
      }
      button:hover .label, button:focus-visible .label { max-width: 80px; opacity: 1; padding: 0 6px 0 12px; }
    </style>
    <button title="Enhance prompt (Alt+Shift+E)" aria-label="Enhance prompt">
      <img alt="">
      <span class="label">Enhance</span>
    </button>`;
  // Extension files need a chrome-extension:// address to load inside a web page
  // (allowed for this image in manifest.json "web_accessible_resources")
  shadow.querySelector("img").src = chrome.runtime.getURL("icons/button.png");
  document.documentElement.appendChild(host);

  const button = shadow.querySelector("button");
  // Clicking would normally move focus onto our button, and then the enhancer
  // couldn't tell which box to read. Cancelling mousedown keeps focus in the chat box.
  button.addEventListener("mousedown", (e) => e.preventDefault());
  button.addEventListener("click", async () => {
    // Make sure the box the pill sits on is the one that gets read
    // (also covers the case where the user never clicked into a box)
    currentBox?.focus();
    try {
      await chrome.runtime.sendMessage({ type: "enhance" });
    } catch (err) {
      // After the extension is reloaded, buttons on already-open tabs lose their connection
      console.error("Prompt Enhancer:", err.message);
      alert("Prompt Enhancer was updated or reloaded. Refresh this page to use the button.");
    }
  });

  // The box the pill is currently attached to
  let currentBox = null;

  // Which box gets the pill: the one the user is typing in, if any; otherwise the
  // main box, which is the last one on the page (it sits below the conversation).
  // Only visible boxes count, since sites can keep hidden copies around.
  function pickBox() {
    const visible = (selector) => [...document.querySelectorAll(selector)]
      .filter((el) => el.getClientRects().length > 0);
    const focused = document.activeElement;
    const focusedBox = visible(adapter.boxSelector).find((el) => el === focused || el.contains(focused));
    // Adapters can narrow what counts as the main box (optional; defaults to any chat box)
    return focusedBox ?? visible(adapter.mainBoxSelector ?? adapter.boxSelector).at(-1) ?? null;
  }

  // Puts the button just above the chat box's top-right corner, or hides it if there's no box
  function place() {
    // Sites redraw large parts of the page on navigation and can throw our button away; put it back
    if (!host.isConnected) document.documentElement.appendChild(host);
    const box = pickBox();
    currentBox = box;
    const rect = box ? adapter.findContainer(box).getBoundingClientRect() : null;
    if (!rect || rect.width === 0) {
      host.style.display = "none";
      return;
    }
    host.style.display = "block"; // must be visible before we can measure the button
    // Anchored by the right edge, so the hover label grows to the left instead of
    // pushing the logo out from under the cursor
    host.style.right = `${document.documentElement.clientWidth - rect.right}px`;
    host.style.top = `${rect.top - host.offsetHeight - 6}px`;
  }

  // Chat sites swap, move and resize their box all the time (new chat, long prompts,
  // page navigation without reloads), so re-check a few times a second
  setInterval(place, 300);
  window.addEventListener("resize", place);
  window.addEventListener("scroll", place, true);
  // Move the pill right away when the user clicks into a different box
  document.addEventListener("focusin", place);
  place();
})();
