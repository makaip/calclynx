import { TextFieldProseMirrorSchema } from './textfield-schema.js';
import { TextFieldProseMirrorContent } from './textfield-content.js';
import { MathNodeView } from './textfield-math-nodeview.js';
import { TextFieldProseMirrorEventHandler } from './textfield-event-handler.js';
import { ObjectGroup } from '../core/objectgroup.js';

class TextFieldProseMirror {
  constructor(textGroup, isNewField, content = '') {
    this.textGroup = textGroup;
    this.proseMirrorView = null;
    this.saveTimeout = null;
    
    this.schemaManager = new TextFieldProseMirrorSchema();
    this.eventHandler = null;
    this.content = new TextFieldProseMirrorContent(this);
    this.resizeHandler = null;
    
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

  getFormattingKeymap(schema) {
    const { toggleMark } = window.ProseMirror;
    const keymap = {};
    
    if (schema.marks.strong) {
      keymap['Mod-b'] = toggleMark(schema.marks.strong);
    }
    
    if (schema.marks.em) {
      keymap['Mod-i'] = toggleMark(schema.marks.em);
    }
    
    if (schema.marks.underline) {
      keymap['Mod-u'] = toggleMark(schema.marks.underline);
    }
    
    return keymap;
  }

  createContainer() {
    this.container = document.createElement('div');
    this.container.className = 'text-field-container';
    this.container.textFieldInstance = this;

    const circleIndicator = document.createElement('div');
    circleIndicator.className = 'circle-indicator';
    this.container.appendChild(circleIndicator);

    this.container.addEventListener('click', (event) => {
      event.stopPropagation();
      this.focus();
    });

    this.textGroup.element.appendChild(this.container);
    this.resizeHandler = new TextFieldResizeHandler(this);
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
    this.editorElement.tabIndex = 0;
    this.container.appendChild(this.editorElement);

    const initialDoc = this.schemaManager.createInitialDoc(content);

    this.proseMirrorView = new EditorView(this.editorElement, {
      state: EditorState.create({
        doc: initialDoc,
        schema: schema,
        plugins: [
          history(),
          keymap(baseKeymap),
          keymap(this.getFormattingKeymap(schema)),
          keymap({
            '$': (state, dispatch) => {
              const mathFields = this.editorElement.querySelectorAll('.mathquill');
              for (const field of mathFields) {
                if (field.mathquillObject) {
                  const hasFocus = field.contains(document.activeElement) ||
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
        
        if (mathField) {
          ObjectGroup.clearAllSelections();
          return true;
        }
        
        if (this.eventHandler) {
          this.eventHandler.blurAllMathFields(view);
        }
        
        ObjectGroup.clearAllSelections();
        return false;
      },
      handleKeyDown: (view, event) => {
        return this.eventHandler ? this.eventHandler.handleKeyDown(view, event) : false;
      },
      handlePaste: (view, event, slice) => {
        const target = event.target;
        const mathField = target.closest('.mathquill');
        
        if (mathField) {
          event.preventDefault();
          event.stopPropagation();
          return true;
        }
        
        return false;
      },
      handleDOMEvents: {
        paste: (view, event) => {
          const target = event.target;
          const mathField = target.closest('.mathquill');
          
          if (mathField) {
            return true;
          }
          return false;
        },
        input: (view, event) => {
          const target = event.target;
          const mathField = target.closest('.mathquill');
          
          if (mathField) {
            return true;
          }
          return false;
        },
        beforeinput: (view, event) => {
          const target = event.target;
          const mathField = target.closest('.mathquill');
          
          if (mathField) {
            return true;
          }
          return false;
        }
      }
    });

    this.eventHandler = new TextFieldProseMirrorEventHandler(this.proseMirrorView);

    if (this.resizeHandler) {
      this.resizeHandler.createResizeHandles(this.container);
    }

    if (content && typeof content === 'object' && content.text !== undefined && content.mathFields !== undefined) {
      setTimeout(() => {
        this.content.setOptimizedContent(content);
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
        
        const toolbar = window.getTextFormatToolbar && window.getTextFormatToolbar();
        if (toolbar && toolbar.activeTextField === this) {
            toolbar.updateButtonStates();
        }
        
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
          this.textGroup.board.fileManager.saveState();
        }, 500);
      }
    });

    this.editorElement.addEventListener('blur', () => {
      this.textGroup.board.fileManager.saveState();
      const toolbar = window.getTextFormatToolbar && window.getTextFormatToolbar();
      if (toolbar) {
        setTimeout(() => {
          const focusedElement = document.activeElement;
          const hasProseMirrorFocus = document.querySelector('.ProseMirror:focus-within');
          const isFocusInTextEditor = focusedElement && (
            focusedElement.closest('.text-editor') || 
            focusedElement.closest('.prosemirror-editor') ||
            focusedElement.classList.contains('ProseMirror')
          );
          
          if (!hasProseMirrorFocus && !isFocusInTextEditor) {
            toolbar.hide();
          }
        }, 50); 
      }
    });

    this.editorElement.addEventListener('focus', () => {
      ObjectGroup.clearAllSelections();
      
      const toolbar = window.getTextFormatToolbar && window.getTextFormatToolbar();
      if (toolbar) {
        toolbar.show(this);
      }
    });

    this.editorElement.addEventListener('click', (event) => {
      event.stopPropagation();
      const mathField = event.target.closest('.mathquill');
      
      if (!mathField) {
        ObjectGroup.clearAllSelections();
        
        if (!this.proseMirrorView.hasFocus()) {
          this.proseMirrorView.focus();
        }
      }
      
      const toolbar = window.getTextFormatToolbar && window.getTextFormatToolbar();
      if (toolbar) {
        toolbar.show(this);
      }
    });
  }

  focus() {
    if (this.proseMirrorView) {
      ObjectGroup.clearAllSelections();
      this.proseMirrorView.focus();
      
      if (this.proseMirrorView.state.doc.content.size <= 2) {
        const { TextSelection } = window.ProseMirror;
        const tr = this.proseMirrorView.state.tr.setSelection(
          new TextSelection(this.proseMirrorView.state.doc.resolve(1))
        );
        this.proseMirrorView.dispatch(tr);
      }
      
      const toolbar = window.getTextFormatToolbar && window.getTextFormatToolbar();
      if (toolbar) {
        setTimeout(() => {
          if (this.proseMirrorView.hasFocus() || document.activeElement === this.editorElement) {
            toolbar.show(this);
          }
        }, 50);
      }
    }
  }

  remove() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    if (this.resizeHandler) {
      this.resizeHandler.destroy();
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

  getWidthData() {
    return this.resizeHandler ? this.resizeHandler.getWidthData() : null;
  }

  setWidthData(data) {
    if (this.resizeHandler) {
      this.resizeHandler.setWidthData(data);
    }
  }
}

export { TextFieldProseMirror };