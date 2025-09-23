class TextFieldProseMirror {
  constructor(textGroup, isNewField, content = '') {
    this.textGroup = textGroup;
    this.proseMirrorView = null;
    this.schema = null;
    this.saveTimeout = null;
    
    this.content = new TextFieldProseMirrorContent(this);
    
    if (window.proseMirrorReady) {
      this.initialize(isNewField, content);
    } else {
      window.addEventListener('prosemirror-ready', () => {
        this.initialize(isNewField, content);
      });
    }
  }

  initialize(isNewField, content) {
    if (!window.ProseMirror) {
      console.error('ProseMirror not available, cannot initialize TextFieldProseMirror');
      return;
    }
    
    this.createContainer();
    this.createProseMirrorEditor(content);
    this.attachEventListeners();
    
    if (isNewField) {
      setTimeout(() => this.focus(), 10);
    }
  }

  createContainer() {
    this.container = document.createElement('div');
    this.container.className = 'text-field-container';
    this.container.textFieldInstance = this;

    const circleIndicator = document.createElement('div');
    circleIndicator.className = 'circle-indicator';
    this.container.appendChild(circleIndicator);

    this.textGroup.element.appendChild(this.container);
  }

  createProseMirrorEditor(content = '') {
    if (!window.ProseMirror) {
      console.error('ProseMirror not available');
      return;
    }

    const { Schema, EditorState, EditorView, TextSelection, basicSchema, history, keymap, baseKeymap } = window.ProseMirror;

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

    this.content.schema = this.schema;
    this.editorElement = document.createElement('div');
    this.editorElement.className = 'text-editor prosemirror-editor';
    this.container.appendChild(this.editorElement);

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

    this.proseMirrorView = new EditorView(this.editorElement, {
      state: EditorState.create({
        doc: initialDoc,
        schema: this.schema,
        plugins: [
          history(),
          keymap(baseKeymap),
          keymap({
            '$': (state, dispatch) => {
              if (dispatch) {
                const tr = state.tr.replaceSelectionWith(
                  this.schema.nodes.math.create({ latex: "" })
                );
                dispatch(tr);

                setTimeout(() => {
                  const mathFields = this.editorElement.querySelectorAll('.mathquill');
                  for (const field of mathFields) {
                    if (field.mathquillObject && field.mathquillObject.latex() === '') {
                      field.mathquillObject.focus();
                      break;
                    }
                  }
                }, 10);
              }
              return true;
            }
          })
        ]
      }),
      nodeViews: {
        math: (node, view, getPos) => new MathNodeView(node, view, getPos)
      },
      handleClick: (view, pos, event) => {
        const target = event.target;
        const mathField = target.closest('.mathquill');
        
        if (!mathField) {
          const allMathFields = view.dom.querySelectorAll('.mathquill');
          allMathFields.forEach(field => {
            if (field.mathquillObject) {
              field.mathquillObject.blur();
            }
          });
        }
        
        return false;
      },
      handleKeyDown: (view, event) => {
        return this.handleKeyDown(view, event);
      }
    });

    if (content && typeof content === 'object' && content.text !== undefined && content.mathFields !== undefined) {
      setTimeout(() => {
        this.content.setLegacyOptimizedContent(content);
      }, 10);
    }
  }

  handleKeyDown(view, event) {
    if (event.key === 'ArrowLeft') {
      const { $from } = view.state.selection;
      const beforeNode = $from.nodeBefore;
      
      if (beforeNode && beforeNode.type.name === 'math') {
        const mathElements = view.dom.querySelectorAll('.mathquill');
        for (const element of mathElements) {
          if (element.mathquillObject && element.mathquillObject.latex() === beforeNode.attrs.latex) {
            element.mathquillObject.focus();
            element.mathquillObject.moveToRightEnd();
            return true;
          }
        }
      }
    } else if (event.key === 'ArrowRight') {
      const { $from } = view.state.selection;
      const afterNode = $from.nodeAfter;
      
      if (afterNode && afterNode.type.name === 'math') {
        const mathElements = view.dom.querySelectorAll('.mathquill');
        for (const element of mathElements) {
          if (element.mathquillObject && element.mathquillObject.latex() === afterNode.attrs.latex) {
            element.mathquillObject.focus();
            element.mathquillObject.moveToLeftEnd();
            return true;
          }
        }
      }
    } else if (event.key === 'Backspace') {
      return this.handleBackspace(view, event);
    } else if (event.key === 'Delete') {
      return this.handleDelete(view, event);
    }
    
    return false;
  }

  handleBackspace(view, event) {
    const { $from } = view.state.selection;
    const beforeNode = $from.nodeBefore;
    
    if (beforeNode && beforeNode.type.name === 'math' && view.state.selection.empty) {
      event.preventDefault();
      // find the MQ field and delete last character
      const mathElements = view.dom.querySelectorAll('.mathquill');
      for (const element of mathElements) {
        if (element.mathquillObject && element.mathquillObject.latex() === beforeNode.attrs.latex) {
          const currentLatex = element.mathquillObject.latex();
          if (currentLatex.length > 0) {
            // MQ focus, move to end, delete last character
            element.mathquillObject.focus();
            element.mathquillObject.moveToRightEnd();
            element.mathquillObject.keystroke('Backspace');
          } else {
            // if MQ empty, delete entire node
            const pos = $from.pos - 1;
            const tr = view.state.tr.delete(pos, pos + 1);
            view.dispatch(tr);
          }
          return true;
        }
      }
    }
    return false;
  }

  handleDelete(view, event) {
    const { $from } = view.state.selection;
    const afterNode = $from.nodeAfter;
    
    if (afterNode && afterNode.type.name === 'math' && view.state.selection.empty) {
      event.preventDefault();
      // find the MQ field and delete last character
      const mathElements = view.dom.querySelectorAll('.mathquill');
      for (const element of mathElements) {
        if (element.mathquillObject && element.mathquillObject.latex() === afterNode.attrs.latex) {
          const currentLatex = element.mathquillObject.latex();
          if (currentLatex.length > 0) {
            // MQ focus, move to end, delete last character
            element.mathquillObject.focus();
            element.mathquillObject.moveToLeftEnd();
            element.mathquillObject.keystroke('Delete');
          } else {
            // if MQ empty, delete entire node
            const pos = $from.pos;
            const tr = view.state.tr.delete(pos, pos + 1);
            view.dispatch(tr);
          }
          return true;
        }
      }
    }
    return false;
  }

  attachEventListeners() {
    if (!this.proseMirrorView) return;

    this.proseMirrorView.setProps({
      ...this.proseMirrorView.props,
      dispatchTransaction: (tr) => {
        const newState = this.proseMirrorView.state.apply(tr);
        this.proseMirrorView.updateState(newState);
        
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
          this.textGroup.board.fileManager.saveState();
        }, 500);
      }
    });

    this.editorElement.addEventListener('blur', () => {
      this.textGroup.board.fileManager.saveState();
    });
  }

  focus() {
    if (this.proseMirrorView) {
      this.proseMirrorView.focus();
      
      if (this.proseMirrorView.state.doc.content.size <= 2) {
        const { TextSelection } = window.ProseMirror;
        const tr = this.proseMirrorView.state.tr.setSelection(
          new TextSelection(this.proseMirrorView.state.doc.resolve(1))
        );
        this.proseMirrorView.dispatch(tr);
      }
    }
  }

  remove() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    if (this.proseMirrorView) {
      this.proseMirrorView.destroy();
    }
    
    this.textGroup.remove();
  }

  getContent() {
    return this.content.getContent();
  }

  setContent(content) {
    this.content.setContent(content);
  }

  getOptimizedContent() {
    return this.content.getOptimizedContent();
  }

  setOptimizedContent(content) {
    return this.content.setOptimizedContent(content);
  }
}