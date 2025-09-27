class MathNodeView {
  constructor(node, view, getPos) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;

    this.dom = document.createElement("span");
    this.dom.className = "mathquill";
    this.dom.setAttribute("data-latex", node.attrs.latex);

    if (window.MathQuill) {
      this.initializeMathQuill();
    }
  }

  initializeMathQuill() {
    const MQ = window.MathQuill.getInterface(2);
    if (!MQ) return;

    this.mathField = MQ.MathField(this.dom, {
      spaceBehavesLikeTab: false,
      leftRightIntoCmdGoes: 'up',
      restrictMismatchedBrackets: true,
      sumStartsWithNEquals: true,
      supSubsRequireOperand: true,
      charsThatBreakOutOfSupSub: '+-=<>',
      autoSubscriptNumerals: true,
      autoCommands: 'pi theta sqrt sum prod alpha beta gamma delta epsilon zeta eta mu nu xi rho sigma tau phi chi psi omega',
      autoOperatorNames: 'sin cos tan sec csc cot sinh cosh tanh log ln exp lim sup inf det gcd lcm min max',
      maxDepth: 10,
      handlers: {
        edit: () => {
          this.updateNodeContent();
        },
        enter: () => {
          this.exitMathField('right');
        },
        moveOutOf: (dir) => {
          const MQInterface = window.MathQuill.getInterface(2);
          if (dir === MQInterface.L) {
            this.exitMathField('left');
          } else if (dir === MQInterface.R) {
            this.exitMathField('right');
          }
        },
        deleteOutOf: (dir) => {
          const latex = this.mathField.latex();
          const MQInterface = window.MathQuill.getInterface(2);
          if (latex.length === 0) {
            const pos = this.getPos();
            const tr = this.view.state.tr.delete(pos, pos + 1);
            this.view.dispatch(tr);
            this.view.focus();
          } else if (dir === MQInterface.L) {
            this.exitMathField('left');
          } else if (dir === MQInterface.R) {
            this.exitMathField('right');
          }
        },
        upOutOf: () => {
          this.exitMathField('left');
        },
        downOutOf: () => {
          this.exitMathField('right');
        }
      }
    });

    this.dom.mathquillObject = this.mathField;
    this.mathField.latex(this.node.attrs.latex);

    this.dom.addEventListener('focus', () => {
      this.blurOtherMathFields();
    }, true);

    this.dom.addEventListener('mousedown', (event) => {
      event.preventDefault();
    });

    this.dom.addEventListener('click', (event) => {
      event.stopPropagation();
      
      if (this.mathField) {
        this.blurOtherMathFields();
          if (this.mathField) {
            this.mathField.focus();
          }
      }
    });

    if (this.node.attrs.latex === '') {
      this.shouldFocus = true;
      setTimeout(() => {
        if (this.shouldFocus) {
          this.mathField.focus();
          this.shouldFocus = false;
        }
      }, 10);
    }

    this.dom.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.exitMathField('right');
      } else if (e.key === '$') {
        e.preventDefault();
        e.stopPropagation();
        this.exitMathField('right');
      }
    });
  }

  blurOtherMathFields() {
    const allMathFields = this.view.dom.querySelectorAll('.mathquill');
    allMathFields.forEach(field => {
      if (field !== this.dom && field.mathquillObject) {
        field.mathquillObject.blur();
      }
    });
  }

  updateNodeContent() {
    if (!this.mathField) return;

    const newLatex = this.mathField.latex();
    if (newLatex !== this.node.attrs.latex) {
      const pos = this.getPos();
      const tr = this.view.state.tr.setNodeMarkup(pos, null, { latex: newLatex });
      this.view.dispatch(tr);
    }
  }

  exitMathField(direction) {
    if (this.mathField) {
      this.mathField.blur();
    }
    
    const pos = this.getPos();
    let targetPos;
    
    if (direction === 'left') {
      targetPos = this.view.state.doc.resolve(pos);
    } else {
      targetPos = this.view.state.doc.resolve(pos + 1);
    }
    
    const { TextSelection } = window.ProseMirror;
    const tr = this.view.state.tr.setSelection(
      new TextSelection(targetPos)
    );
    this.view.dispatch(tr);
    this.view.focus();
  }

  stopEvent(event) {
    if (event.type === 'keydown') {
      const key = event.key;
      if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown' ||
          key === 'Backspace' || key === 'Delete' || key === 'Enter' || key === 'Escape' ||
          key === 'Tab' || key === '$') {
        return true;
      }
    }
    return false;
  }

  ignoreMutation() {
    return true;
  }

  update(node) {
    if (node.type.name !== "math") return false;
    
    if (this.mathField && node.attrs.latex !== this.mathField.latex()) {
      this.mathField.latex(node.attrs.latex);
    }
    
    this.node = node;
    return true;
  }

  selectNode() {
    this.dom.classList.add('ProseMirror-selectednode');
  }

  deselectNode() {
    this.dom.classList.remove('ProseMirror-selectednode');
    if (this.mathField) {
      this.mathField.blur();
    }
  }

  handleClick(view, pos, event) {
    if (this.mathField) {
      event.preventDefault();
      event.stopPropagation();
      
      this.blurOtherMathFields();
      
        if (this.mathField) {
          this.mathField.focus();
        }
      
      return true;
    }
    return false;
  }

  destroy() {
    this.shouldFocus = false;
    if (this.mathField) {
      this.mathField.revert();
    }
  }
}