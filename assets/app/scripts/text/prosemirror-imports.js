import { Schema } from "https://esm.sh/prosemirror-model";
import { EditorState, TextSelection } from "https://esm.sh/prosemirror-state";
import { EditorView } from "https://esm.sh/prosemirror-view";
import { schema as basicSchema } from "https://esm.sh/prosemirror-schema-basic";
import { addListNodes } from "https://esm.sh/prosemirror-schema-list";
import { history } from "https://esm.sh/prosemirror-history";
import { keymap } from "https://esm.sh/prosemirror-keymap";
import { baseKeymap, toggleMark, setBlockType, wrapIn } from "https://esm.sh/prosemirror-commands";
import { wrapInList, splitListItem, liftListItem, sinkListItem } from "https://esm.sh/prosemirror-schema-list";

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
window.dispatchEvent(new Event('prosemirror-ready'));