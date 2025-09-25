class TextFieldProseMirrorSchema {
  constructor() {
    this.schema = null;
    this.mathNodeSpec = {
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
  }

  createSchema() {
    if (!window.ProseMirror) {
      throw new Error('ProseMirror not available');
    }

    const { Schema, basicSchema } = window.ProseMirror;

    this.schema = new Schema({
      nodes: basicSchema.spec.nodes.addToEnd("math", this.mathNodeSpec),
      marks: basicSchema.spec.marks
    });

    return this.schema;
  }

  createInitialDoc(content = '') {
    if (!this.schema) {
      this.createSchema();
    }

    let initialDoc;
    
    if (content) {
      try {
        if (typeof content === 'object' && content.type && content.content) {
          initialDoc = this.schema.nodeFromJSON(content);
        } else if (typeof content === 'object' && content.text !== undefined && content.mathFields !== undefined) {
          initialDoc = this.schema.nodes.doc.create(null, [this.schema.nodes.paragraph.create()]);
        } else {
          const textContent = typeof content === 'string' ? content : '';
          const paragraphs = textContent.split('\n');
          const docContent = paragraphs.map(p => 
            this.schema.nodes.paragraph.create(null, p ? [this.schema.text(p)] : [])
          );
          initialDoc = this.schema.nodes.doc.create(null, docContent.length ? docContent : [this.schema.nodes.paragraph.create()]);
        }
      } catch (error) {
        console.error('Error parsing initial content:', error);
        initialDoc = this.schema.nodes.doc.create(null, [this.schema.nodes.paragraph.create()]);
      }
    } else {
      initialDoc = this.schema.nodes.doc.create(null, [this.schema.nodes.paragraph.create()]);
    }

    return initialDoc;
  }

  getSchema() {
    return this.schema || this.createSchema();
  }

  createMathNode(latex = '') {
    if (!this.schema) {
      this.createSchema();
    }
    return this.schema.nodes.math.create({ latex });
  }
}