// Gemini adapter: the only file that knows gemini.google.com's page layout.
// If a Gemini redesign breaks the Enhance button, this is the file to fix.
// button.js (loaded right after this) reads this object.
globalThis.__promptEnhancerAdapter = {
  name: "Gemini",
  // What any chat box looks like here: a Quill editor (.ql-editor), used both for
  // the main box and for editing an earlier message
  boxSelector: '.ql-editor[contenteditable="true"]',
  // The visible box around the editor; the button sits just above its top-right corner.
  // Gemini's outer input area has changed names over time, so fall back step by step.
  findContainer: (box) =>
    box.closest("input-area-v2, input-container, .input-area") ??
    box.closest("rich-textarea") ??
    box.parentElement
};
