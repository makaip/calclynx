class TextFieldProseMirrorContent {
  constructor(textField) {
    this.textField = textField;
    this.schema = null;
    this.initSchema();
  }

  initSchema() {
    if (!window.ProseMirror) return;
    const { Schema, basicSchema } = window.ProseMirror;

    const mathNodeSpec = {
      inline: true,
      group: "inline",
      atom: true,
      attrs: { latex: { default: "" } },
      toDOM: (node) => ["span", { 
        class: "mathquill", 
        "data-latex": node.attrs.latex 
      }],
      parseDOM: [{
        tag: "span.mathquill",
        getAttrs: dom => ({ latex: dom.getAttribute("data-latex") || "" })
      }]
    };

    this.schema = new Schema({
      nodes: basicSchema.spec.nodes.addToEnd("math", mathNodeSpec),
      marks: basicSchema.spec.marks
    });
  }

  getProseMirrorContent() {
    if (!this.textField.proseMirrorView || !this.textField.proseMirrorView.state) {
      return null;
    }
    return this.textField.proseMirrorView.state.doc.toJSON();
  }

  setProseMirrorContent(docJson) {
    if (!this.textField.proseMirrorView || !this.schema || !docJson) return;

    try {
      const doc = this.schema.nodeFromJSON(docJson);
      const tr = this.textField.proseMirrorView.state.tr.replaceWith(0, this.textField.proseMirrorView.state.doc.content.size, doc.content);
      this.textField.proseMirrorView.dispatch(tr);
    } catch (error) {
      console.error('Error setting ProseMirror content:', error);
    }
  }

  getLegacyOptimizedContent() {
    if (!this.textField.proseMirrorView) return { text: '', mathFields: [] };

    const content = { text: '', mathFields: [] };
    const doc = this.textField.proseMirrorView.state.doc;

    doc.descendants((node, pos) => {
      if (node.type.name === 'text') {
        content.text += node.text;
      } else if (node.type.name === 'math') {
        content.mathFields.push({
          position: content.text.length,
          latex: node.attrs.latex || ''
        });
        content.text += '\uE000'; 
      } else if (node.type.name === 'paragraph' && node.content.size === 0) {
        if (content.text.length > 0) {
          content.text += '\n';
        }
      }
    });

    return content;
  }

  setLegacyOptimizedContent(content) {
    if (!this.textField.proseMirrorView || !this.schema) return;

    const doc = TextFieldCompatibility.convertV2ToV3(content, this.schema);
    if (doc) {
      const tr = this.textField.proseMirrorView.state.tr.replaceWith(
        0, 
        this.textField.proseMirrorView.state.doc.content.size, 
        doc.content
      );
      this.textField.proseMirrorView.dispatch(tr);
    }
  }

  getContent() {
    return this.getProseMirrorContent();
  }

  getOptimizedContent() {
    return this.getLegacyOptimizedContent();
  }

  setOptimizedContent(content) {
    return this.setLegacyOptimizedContent(content);
  }
}