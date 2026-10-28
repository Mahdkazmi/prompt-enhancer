// Gemini adapter: the only file that knows gemini.google.com's page layout.
// If a Gemini redesign breaks the Enhance button, this is the file to fix.
// button.js (loaded right after this) reads this object.
globalThis.__promptEnhancerAdapter = {
  name: "Gemini",
  // The editor the user types in: a Quill editor (.ql-editor) inside Gemini's
  // <rich-textarea> element. Only visible boxes count, as hidden copies can linger.
  findBox: () => {
    const candidates = document.querySelectorAll(
      'rich-textarea .ql-editor[contenteditable="true"], .ql-editor[contenteditable="true"]'
    );
    return [...candidates].find((el) => el.getClientRects().length > 0) ?? null;
  },
  // The visible box around the editor; the button sits just above its top-right corner.
  // Gemini's outer input area has changed names over time, so fall back step by step.
  findContainer: (box) =>
    box.closest("input-area-v2, input-container, .input-area") ??
    box.closest("rich-textarea") ??
    box.parentElement
};
