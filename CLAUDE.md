# Prompt Enhancer — Browser Extension

## What this is
A Chromium browser extension (Manifest V3) that takes the prompt a user has typed into any LLM chat box (ChatGPT, Claude, Gemini, Copilot, Perplexity, DeepSeek, etc.), rewrites it into a clearer, better-structured prompt using an LLM, and puts it back in the box.

Positioning: "turns lazy prompts into clear ones without losing your intent" — NOT "maximum output". Preserving the user's meaning matters more than making the prompt longer or fancier.

## Developer
Mahd — BS Data Science student, comfortable with Python/LLMs/RAG, **new to browser extensions and JavaScript**. This is a portfolio project.

## How to work with me (important)
- **One step at a time.** Do one small step, explain it, then stop and wait for me to test/confirm before moving on. Do not build multiple features in one go.
- **Explain in plain language.** Short explanations of what each new file/function does and why. No unnecessary jargon.
- **Be a partner, not a yes-man.** If I suggest something, give pros and cons and recommend the best option. Push back if my idea is worse.
- Be direct and concise.
- Before writing a lot of code, tell me the plan for that step in 2–3 lines.
- After each step, tell me exactly how to test it (where to click, what I should see).

## Environment
- Browser: **Opera GX** (Chromium-based). Extensions load from `opera://extensions` → Developer mode → Load unpacked. Code must also work in Chrome/Edge/Brave.
- **Opera reserves Ctrl+Shift+E**, so our shortcut is **Alt+Shift+E**.
- Service worker logs: `opera://extensions` → click "service worker" under the extension.
- After editing files, reload the extension from the extensions page (and refresh the test tab).

## Key decisions (already made — don't change without discussing)
1. **Works on all common LLM sites, not just one.** Two layers:
   - **Generic mode (build first):** user focuses any text box, then presses Alt+Shift+E or right-click → "Enhance prompt". Works on nearly any site.
   - **Site adapters (later):** small per-site modules only for the top 3–4 sites (ChatGPT, Claude, Gemini, maybe Perplexity) for a native feel (e.g. a button inside the UI). Keep them isolated so a site redesign only breaks one file.
2. **Model-aware rewriting (bonus feature):** detect which site the user is on and lightly tailor the rewrite to that model (e.g. XML tags for Claude). Keep it subtle.
3. **Rewriting model:** Groq free tier, OpenAI-compatible endpoint `https://api.groq.com/openai/v1/chat/completions`, model **GPT-OSS 120B** (fallback: Llama 3.3 70B). Avoid small 7–8B models — they drift from user intent.
   - Provider, endpoint and model name must live in **one config place** so switching to Gemini or another provider is a one-line change.
4. **Permissions:** use `activeTab` + `scripting` (only touch the page when the user triggers it). No always-on content scripts on every site unless needed for adapters.
5. **API key safety:** NEVER hardcode the API key in any committed file. During development, store it via an options page in `chrome.storage.local`. Before publishing: either a small backend proxy holding the key, or a "bring your own key" setting.

## Planned features (in rough order)
1. ✅ Manifest + background service worker skeleton
2. ✅ Grab text from the focused box (generic mode) — skips password fields, handles restricted pages
3. ✅ Options page to save the Groq API key in `chrome.storage.local`
4. ✅ Send the grabbed text to Groq with a rewriting system prompt; log the result
5. ✅ **Preview panel** (swapped ahead of write-back so nothing is ever replaced without a click): in-page panel (shadow DOM) shows original + editable improved prompt, with Copy and Close. No replacing yet.
6. ✅ **Replace button** in the preview: write the (possibly edited) improved prompt back into the box (must handle `textarea`/`input` AND `contenteditable` editors like ChatGPT/Claude — these need input events fired so the site registers the change)
7. ✅ **Task-type handling — done in reduced form.** Tests (explain / code / writing / translate) showed one general prompt adapts well, so no per-type templates. Instead tightened `prompts.js`: ask only for details that block the task (otherwise chatbot picks and states a default), never leak answer content ("such as X, Y" lists), keep the user's voice. Revisit real templates only if a task type keeps failing.
   - Known quirk (accepted for now, revisit with real usage): on long prompts the model sometimes still adds an unneeded "ask me about X first" closing line (mostly seen on ChatGPT-tailored rewrites). The user can delete it in the preview.
8. ⏸️ **Clarifying questions — deferred.** Target user is a lazy prompter who wants a polished prompt in one press; extra questions defeat that. Technique 8 in `prompts.js` already has the *chatbot* ask for details that block the task.
9. ⏸️ **"Why I changed this" note — deferred** for the same reason (clutter in a one-press flow). Could return later as an optional setting.
10. ✅ Site detection + model-aware tailoring — `SITE_TIPS` in `prompts.js` (Claude: XML tags; ChatGPT/Gemini: Markdown headings), added to the user message only, long prompts only
11. ✅ Site adapters: "✨ Enhance" pill on ChatGPT, Claude and Gemini. Pill follows the focused chat box (incl. edit-message boxes), else sits on the main box. Adapters only give `boxSelector`, optional `mainBoxSelector` (Claude: its edit box is a plain textarea, main box is ProseMirror) and `findContainer`.
12. User-saved custom styles (e.g. short answers vs step-by-step)
13. Publishing prep (key handling, privacy note, store listing)

## Rewriting principles (for the system prompt we'll write)
- Never change what the user is asking for. Clarify, don't reinterpret.
- Add structure only when it helps (context, task, constraints, output format).
- Don't pad short, already-clear prompts.
- Output only the rewritten prompt, no commentary (commentary goes in the separate "why" note feature later).

## File structure (current + planned)
```
prompt-enhancer/
├── CLAUDE.md          # this file
├── manifest.json      # MV3 manifest
├── background.js      # service worker: shortcut, context menu, API calls
├── options.html/.js   # API key + settings
├── config.js          # provider/model/endpoint in one place
├── prompts.js         # rewriting system prompt (+ future templates)
├── panel.js           # in-page preview panel (self-contained; injected via executeScript)
└── adapters/          # content scripts for the in-page Enhance button
    ├── button.js      # shared: draws the pill on the focused chat box (else the bottom-most = main box), keeps it positioned, messages background.js
    ├── chatgpt.js     # per-site: boxSelector (what a chat box looks like) + findContainer (one file per site)
    ├── claude.js
    └── gemini.js
```

## Conventions
- Plain JavaScript (no build step, no frameworks) until there's a clear reason.
- Small, commented functions. Comments explain *why*, not just *what*.
- Handle errors visibly (console + a simple message to the user), never fail silently.
