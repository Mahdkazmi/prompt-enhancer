// Draws the preview panel inside the page.
// executeScript copies only this function's source into the page, so everything
// it needs (styles included) must live inside it.
// data = { state: "loading" | "done" | "error", original, improved?, error? }
export function renderPanel(data) {
  const HOST_ID = "prompt-enhancer-panel";
  let host = document.getElementById(HOST_ID);

  // Closed while the model was still working: don't pop back up
  if (!host && data.state !== "loading") return;

  if (!host) {
    host = document.createElement("div");
    host.id = HOST_ID;
    // Shadow DOM keeps the site's CSS out of our panel, and ours out of the site
    host.attachShadow({ mode: "open" });
    // Chat sites listen for keys page-wide (e.g. to refocus their own box);
    // keep typing inside our panel from reaching them
    for (const type of ["keydown", "keyup", "keypress"]) {
      host.addEventListener(type, (e) => {
        e.stopPropagation();
        if (type === "keydown" && e.key === "Escape") host.remove();
      });
    }
    document.documentElement.appendChild(host);
  }

  const shadow = host.shadowRoot;
  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      .panel {
        position: fixed; right: 16px; bottom: 16px; z-index: 2147483647;
        width: min(480px, calc(100vw - 32px)); max-height: calc(100vh - 32px);
        overflow: auto; box-sizing: border-box; padding: 14px;
        font: 14px/1.4 system-ui, sans-serif;
        background: #fff; color: #1a1a1a;
        border: 1px solid #ddd; border-radius: 10px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
      }
      header { display: flex; justify-content: space-between; align-items: center; font-weight: 600; }
      .label { font-size: 12px; color: #666; margin: 10px 0 4px; }
      .original {
        max-height: 90px; overflow: auto; white-space: pre-wrap;
        padding: 8px; border-radius: 6px; background: #f4f4f4; font-size: 13px;
      }
      textarea {
        width: 100%; min-height: 160px; box-sizing: border-box; resize: vertical;
        padding: 8px; border: 1px solid #ccc; border-radius: 6px;
        font: inherit; background: inherit; color: inherit;
      }
      .loading { color: #666; padding: 8px 0; }
      .error { color: #c00; padding: 8px 0; white-space: pre-wrap; }
      footer { display: flex; gap: 8px; align-items: center; margin-top: 10px; }
      .status { flex: 1; font-size: 12px; color: #1a8f4a; }
      .status.warn { color: #c00; }
      button {
        font: inherit; padding: 6px 14px; cursor: pointer;
        border: 1px solid #ccc; border-radius: 6px; background: #f4f4f4; color: inherit;
      }
      button.primary { background: #2563eb; border-color: #2563eb; color: #fff; }
      button.x { border: none; background: none; font-size: 18px; padding: 0 4px; }
      @media (prefers-color-scheme: dark) {
        .panel { background: #1f1f1f; color: #eee; border-color: #444; }
        .original, button { background: #2c2c2c; border-color: #555; }
        textarea { border-color: #555; }
        .label, .loading { color: #aaa; }
        .error, .status.warn { color: #ff6b6b; }
      }
    </style>
    <div class="panel" role="dialog" aria-label="Prompt Enhancer">
      <header><span>Prompt Enhancer</span><button class="x" aria-label="Close">×</button></header>
      <div class="label">Original</div>
      <div class="original"></div>
      <div class="label">Improved (you can edit it)</div>
      <div class="body"></div>
      <footer>
        <span class="status"></span>
        <button class="close">Close</button>
      </footer>
    </div>`;

  // textContent, never innerHTML, for user/model text: it can't run as code
  shadow.querySelector(".original").textContent = data.original;
  const body = shadow.querySelector(".body");
  const status = shadow.querySelector(".status");

  for (const btn of shadow.querySelectorAll(".x, .close")) {
    btn.addEventListener("click", () => host.remove());
  }

  if (data.state === "loading") {
    body.className = "body loading";
    body.textContent = "Enhancing…";
  } else if (data.state === "error") {
    body.className = "body error";
    body.textContent = data.error;
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = data.improved;
    body.appendChild(textarea);

    const setStatus = (message, isWarning) => {
      status.textContent = message;
      status.className = isWarning ? "status warn" : "status";
    };

    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copy";
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(textarea.value);
      } catch {
        // Some pages block the clipboard API; the old select-and-copy still works there
        textarea.select();
        document.execCommand("copy");
      }
      setStatus("Copied ✓", false);
    });

    const replaceBtn = document.createElement("button");
    replaceBtn.className = "primary";
    replaceBtn.textContent = "Replace";
    replaceBtn.addEventListener("click", async () => {
      // Set by grabText in background.js when the user triggered us
      const target = globalThis.__promptEnhancerTarget;
      if (!target || !target.isConnected) {
        setStatus("The original text box is gone (the page changed). Use Copy instead.", true);
        return;
      }
      const ok = await writeToBox(target, textarea.value);
      // Success: get out of the way and leave the user in their box, ready to send
      if (ok) host.remove();
      else setStatus("This site may not have taken the change. Check the box, or use Copy.", true);
    });

    const footer = shadow.querySelector("footer");
    footer.appendChild(copyBtn);
    footer.appendChild(replaceBtn);
    textarea.focus();
  }

  // Puts text into the user's box in a way the site notices, so its Send button
  // sends the new text. Returns true if the box ended up holding the text.
  async function writeToBox(el, text) {
    el.focus();
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      // React-style sites ignore a plain `el.value = ...`; going through the browser's
      // own setter and then firing an input event makes them pick up the change
      const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, text);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return el.value === text;
    }

    // Rich editors (ChatGPT, Claude, Gemini) keep their own copy of the text and ignore
    // direct DOM edits, so act like a user instead: select everything, then paste over it
    const range = document.createRange();
    range.selectNodeContents(el);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    // Editors learn about selection changes asynchronously; give them a moment
    await new Promise((resolve) => setTimeout(resolve, 50));

    const clipboard = new DataTransfer();
    clipboard.setData("text/plain", text);
    const pasteEvent = new ClipboardEvent("paste", { clipboardData: clipboard, bubbles: true, cancelable: true });
    // dispatchEvent returns false when the editor handled the paste itself
    const handled = !el.dispatchEvent(pasteEvent);
    // Editors that ignore synthetic pastes usually still accept the browser's insertText command
    if (!handled) document.execCommand("insertText", false, text);

    await new Promise((resolve) => setTimeout(resolve, 50));
    // Editors wrap lines in paragraphs, so compare ignoring whitespace differences
    const squash = (s) => s.replace(/\s+/g, " ").trim();
    return squash(el.innerText) === squash(text);
  }
}
