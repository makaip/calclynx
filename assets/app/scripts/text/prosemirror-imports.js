import { Schema } from "https://esm.sh/prosemirror-model";
import { EditorState, TextSelection } from "https://esm.sh/prosemirror-state";
import { EditorView } from "https://esm.sh/prosemirror-view";
import { schema as basicSchema } from "https://esm.sh/prosemirror-schema-basic";
import { history } from "https://esm.sh/prosemirror-history";
import { keymap } from "https://esm.sh/prosemirror-keymap";
import { baseKeymap } from "https://esm.sh/prosemirror-commands";

window.ProseMirror = {
  Schema,
  EditorState,
  TextSelection,
  EditorView,
  basicSchema,
  history,
  keymap,
  baseKeymap
};

window.proseMirrorReady = true;
window.dispatchEvent(new Event('prosemirror-ready'));