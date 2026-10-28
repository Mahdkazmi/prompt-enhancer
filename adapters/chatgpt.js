// ChatGPT adapter: the only file that knows ChatGPT's page layout.
// If a ChatGPT redesign breaks the Enhance button, this is the file to fix.
// button.js (loaded right after this) reads this object.
globalThis.__promptEnhancerAdapter = {
  name: "ChatGPT",
  // The editor the user types in (a contenteditable div with this id).
  // When switching chats, ChatGPT can briefly keep an old hidden copy of the box,
  // so pick the first one that is actually on screen.
  findBox: () => {
    const candidates = document.querySelectorAll('#prompt-textarea, form [contenteditable="true"]');
    return [...candidates].find((el) => el.getClientRects().length > 0) ?? null;
  },
  // The visible box around the editor; the button sits just above its top-right corner
  findContainer: (box) => box.closest("form") ?? box.parentElement
};
