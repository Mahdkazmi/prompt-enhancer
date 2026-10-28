// Claude adapter: the only file that knows claude.ai's page layout.
// If a Claude redesign breaks the Enhance button, this is the file to fix.
// button.js (loaded right after this) reads this object.
globalThis.__promptEnhancerAdapter = {
  name: "Claude",
  // What any chat box looks like here: the main box is a ProseMirror editor;
  // editing an earlier message opens a plain <textarea> instead
  boxSelector: '.ProseMirror[contenteditable="true"], textarea',
  // When nothing is focused, only the ProseMirror box counts as the main box, so the
  // pill doesn't wander into other textareas (project instructions, settings dialogs)
  mainBoxSelector: '.ProseMirror[contenteditable="true"]',
  // The visible box around the editor (the main box sits in a <fieldset>);
  // the button sits just above its top-right corner
  findContainer: (box) => box.closest("fieldset") ?? box.parentElement
};
