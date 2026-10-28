// Claude adapter: the only file that knows claude.ai's page layout.
// If a Claude redesign breaks the Enhance button, this is the file to fix.
// button.js (loaded right after this) reads this object.
globalThis.__promptEnhancerAdapter = {
  name: "Claude",
  // The editor the user types in (a ProseMirror contenteditable). The main chat box sits
  // in a <fieldset>; checking that first avoids picking the editor that appears when you
  // edit an earlier message. Only visible boxes count, as hidden copies can linger.
  findBox: () => {
    const candidates = document.querySelectorAll(
      'fieldset .ProseMirror[contenteditable="true"], .ProseMirror[contenteditable="true"]'
    );
    return [...candidates].find((el) => el.getClientRects().length > 0) ?? null;
  },
  // The visible box around the editor; the button sits just above its top-right corner
  findContainer: (box) => box.closest("fieldset") ?? box.parentElement
};
