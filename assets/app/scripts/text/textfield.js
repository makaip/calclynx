class TextFieldProseMirror {
  constructor(textGroup, isNewField, content = '') {
    this.textGroup = textGroup;
    this.proseMirrorView = null;
    this.saveTimeout = null;
    
    this.schemaManager = new TextFieldProseMirrorSchema();
    this.eventHandler = null; // Will be initialized after proseMirrorView is created
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

    const { EditorState, EditorView, TextSelection, history, keymap, baseKeymap } = window.ProseMirror;

    const schema = this.schemaManager.createSchema();
    this.content.schema = schema;
    
    this.editorElement = document.createElement('div');
    this.editorElement.className = 'text-editor prosemirror-editor';
    this.container.appendChild(this.editorElement);

    const initialDoc = this.schemaManager.createInitialDoc(content);

    this.proseMirrorView = new EditorView(this.editorElement, {
      state: EditorState.create({
        doc: initialDoc,
        schema: schema,
        plugins: [
          history(),
          keymap(baseKeymap),
          keymap({
            '$': (state, dispatch) => {
              const mathFields = this.editorElement.querySelectorAll('.mathquill');
              for (const field of mathFields) {
                if (field.mathquillObject) {
                  const hasFocus = (field.mathquillObject.hasFocus && field.mathquillObject.hasFocus()) ||
                                  field.contains(document.activeElement) ||
                                  field === document.activeElement;
                  
                  if (hasFocus) {
                    return false;
                  }
                }
              }

              if (dispatch) {
                const tr = state.tr.replaceSelectionWith(
                  this.schemaManager.createMathNode("")
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
        
        if (!mathField && this.eventHandler) {
          this.eventHandler.blurAllMathFields(view);
        }
        
        return false;
      },
      handleKeyDown: (view, event) => {
        return this.eventHandler ? this.eventHandler.handleKeyDown(view, event) : false;
      }
    });

    // Initialize event handler now that proseMirrorView exists
    this.eventHandler = new TextFieldProseMirrorEventHandler(this.proseMirrorView);

    if (content && typeof content === 'object' && content.text !== undefined && content.mathFields !== undefined) {
      setTimeout(() => {
        this.content.setLegacyOptimizedContent(content);
      }, 10);
    }
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
      if (window.textFormatToolbar) {
        setTimeout(() => {
          if (!document.querySelector('.ProseMirror:focus-within')) {
            window.textFormatToolbar.hide();
          }
        }, 100);
      }
    });

    this.editorElement.addEventListener('focus', () => {
      if (window.textFormatToolbar) {
        window.textFormatToolbar.show(this);
      }
    });

    this.editorElement.addEventListener('click', () => {
      if (window.textFormatToolbar) {
        window.textFormatToolbar.show(this);
      }
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