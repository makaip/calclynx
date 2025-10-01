async function loadProseMirrorModules() {
  try {
    console.log('Loading ProseMirror modules...');
    
    const [
      { Schema },
      { EditorState, TextSelection },
      { EditorView },
      { schema: basicSchema },
      { addListNodes, wrapInList, splitListItem, liftListItem, sinkListItem },
      { history },
      { keymap },
      { baseKeymap, toggleMark, setBlockType, wrapIn }
    ] = await Promise.all([
      import("https://esm.sh/prosemirror-model"),
      import("https://esm.sh/prosemirror-state"),
      import("https://esm.sh/prosemirror-view"),
      import("https://esm.sh/prosemirror-schema-basic"),
      import("https://esm.sh/prosemirror-schema-list"),
      import("https://esm.sh/prosemirror-history"),
      import("https://esm.sh/prosemirror-keymap"),
      import("https://esm.sh/prosemirror-commands")
    ]);

    window.ProseMirror = {
      Schema,
      EditorState,
      TextSelection,
      EditorView,
      basicSchema,
      addListNodes,
      history,
      keymap,
      baseKeymap,
      toggleMark,
      setBlockType,
      wrapIn,
      wrapInList,
      splitListItem,
      liftListItem,
      sinkListItem
    };

    window.proseMirrorReady = true;
    console.log('ProseMirror ready flag set - all modules loaded');

    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new Event('prosemirror-ready'));
    }
  } catch (error) {
    console.error('Failed to load ProseMirror modules:', error);
    window.proseMirrorLoadFailed = true;
    window.dispatchEvent(new Event('prosemirror-failed'));
  }
}

loadProseMirrorModules();