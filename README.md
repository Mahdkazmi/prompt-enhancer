<p align="center">
  <img src="icons/icon128.png" alt="Prompt Enhancer logo" width="96">
</p>

<h1 align="center">Prompt Enhancer</h1>

<p align="center">A Chromium browser extension that turns rough prompts into clear, well-structured ones — without changing what you asked for.</p>

Type a quick prompt into ChatGPT, Claude, Gemini or any other chat box, press one button, review the improved version, and replace your text with it.

<!-- Demo GIF: record one and save it as docs/demo.gif, then replace this comment with:
![Prompt Enhancer demo](docs/demo.gif)
-->

## Example

| You type | Prompt Enhancer suggests |
|---|---|
| `fix my python code it gives an error` | Fix my Python code that raises an error. Provide the corrected code in a code block and a brief explanation of what was changed and why. Before you start, ask me to share the code snippet and the exact error message I'm seeing. |
| `translate good morning to french` | Translate the phrase "good morning" into French. *(already clear — only tidied, not padded)* |

## Features

- **Works on any site.** Focus any text box and press `Alt+Shift+E`, or right-click → **Enhance prompt**.
- **One-click button** on ChatGPT, Claude and Gemini, placed next to the chat box. It follows whichever box you are typing in, including the box for editing an earlier message.
- **Preview before replace.** The improved prompt opens in an editable panel. Nothing is changed until you click **Replace**; **Copy** is always available as a fallback.
- **Intent-preserving rewrites.** The rewriting instructions are built around a few rules: keep the request at the same scope, never invent facts about the user, don't pad prompts that are already clear, and only ask for missing details when the task is impossible without them.
- **Model-aware formatting.** Long, multi-part prompts are structured to suit the target chatbot — XML-style sections for Claude, Markdown headings for ChatGPT and Gemini.
- **Reliable write-back.** Replacing text works with plain text boxes and with the rich editors used by modern chat apps (ProseMirror, Quill), so the site's Send button sends the new text.

## Installation

The extension is not yet published to a store. To run it locally:

1. Clone this repository.
2. Open your browser's extensions page (`chrome://extensions`, `edge://extensions` or `opera://extensions`).
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the project folder.

Developed and tested on Opera GX; it uses standard Manifest V3 APIs and targets all Chromium browsers.

## Setup

The extension uses [Groq](https://groq.com)'s API to rewrite prompts.

1. Create a free API key at [console.groq.com](https://console.groq.com) → **API Keys**.
2. On the extensions page, open Prompt Enhancer's **Details** → **Extension options**.
3. Paste the key and click **Save**.

## Usage

1. Type a prompt into a chat box.
2. Click the round **P** button above the box (ChatGPT, Claude, Gemini; hover it to see the **Enhance** label), or press `Alt+Shift+E` on any site.
3. Review the suggestion in the panel and edit it if you like.
4. Click **Replace** to put it in the chat box, or **Copy** to paste it yourself.

If the shortcut does nothing, check that it is assigned on your browser's extension shortcuts page (e.g. `chrome://extensions/shortcuts`).

## Privacy and permissions

- Your prompt is sent to Groq **only when you trigger an enhancement**. Nothing is collected or sent anywhere else.
- Your API key is stored locally in the browser (`chrome.storage.local`) and is only sent to Groq.
- Password fields are never read.

| Permission | Why it is needed |
|---|---|
| `activeTab`, `scripting` | Read the focused text box and show the preview panel when you trigger the extension |
| `contextMenus` | The right-click **Enhance prompt** option |
| `storage` | Save your API key locally |
| `api.groq.com` | Send the prompt to the rewriting model |
| `chatgpt.com`, `claude.ai`, `gemini.google.com` | Show the Enhance button on these sites |

## How it works

```
Trigger (button / shortcut / right-click)
        │
        ▼
background.js ── reads the focused box (injected script) ──► text + site
        │
        ├── prompts.js builds the request (rewriting rules + site formatting tip)
        ├── sends it to the model configured in config.js
        │
        ▼
panel.js shows original vs. improved in the page ── Replace ──► writes back into the box
```

## Project structure

| File | Purpose |
|---|---|
| `manifest.json` | Extension manifest (Manifest V3) |
| `background.js` | Service worker: triggers, reading the text box, API call, showing the panel |
| `config.js` | Provider endpoint, model and temperature — the single place to switch providers |
| `prompts.js` | Rewriting instructions, per-site formatting tips, response parsing |
| `panel.js` | In-page preview panel (Shadow DOM, so site styles can't affect it), including write-back |
| `options.html`, `options.js` | Settings page for the API key |
| `adapters/button.js` | Shared Enhance button: placement, focus tracking, messaging |
| `adapters/chatgpt.js`, `claude.js`, `gemini.js` | Per-site details (where the chat box is). A site redesign only affects its own file. |

## Tech stack

- Plain JavaScript, no build step or frameworks
- Chrome Extensions Manifest V3 (service worker, `scripting`, content scripts)
- [Groq](https://groq.com) API (OpenAI-compatible) with `openai/gpt-oss-120b`

The provider is configured in one file, so any OpenAI-compatible API can be used instead.

## Roadmap

- Saved style preferences (e.g. always concise, always step-by-step)
- Store release with a simpler key setup
