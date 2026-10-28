// ChatGPT adapter: the only file that knows ChatGPT's page layout.
// If a ChatGPT redesign breaks the Enhance button, this is the file to fix.
// button.js (loaded right after this) reads this object.
globalThis.__promptEnhancerAdapter = {
  name: "ChatGPT",
  // What any chat box looks like here: the main box (a contenteditable with this id)
  // and the box that opens when you edit an earlier message
  boxSelector: '#prompt-textarea, form [contenteditable="true"]',
  // The visible box around the editor; the button sits just above its top-right corner
  findContainer: (box) => box.closest("form") ?? box.parentElement
};
