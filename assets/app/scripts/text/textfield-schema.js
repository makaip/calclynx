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

		const { Schema, basicSchema, addListNodes } = window.ProseMirror;

		const underlineMarkSpec = {
			toDOM() { return ["u", 0]; },
			parseDOM: [{ tag: "u" }]
		};

		const nodes = addListNodes(basicSchema.spec.nodes, "paragraph block*", "block")
			.addToEnd("math", this.mathNodeSpec);

		const marks = basicSchema.spec.marks.addToEnd("underline", underlineMarkSpec);

		this.schema = new Schema({
			nodes: nodes,
			marks: marks
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
				// if it has type and content then its already ProseMirror JSON (v3+)
				if (typeof content === 'object' && content.type && content.content) {
					initialDoc = this.schema.nodeFromJSON(content);
					// if it has text and mathfields then its using v2 format
				} else if (typeof content === 'object' && content.text !== undefined && content.mathFields !== undefined) {
					initialDoc = this.schema.nodes.doc.create(null, [this.schema.nodes.paragraph.create()]);
					// handle a plain string and use \n to build paragraph nodes (v1, prob no one using this lol)
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

export { TextFieldProseMirrorSchema };