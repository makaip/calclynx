class MathFieldUtils {
  static createCircleIndicator() {
    const circleIndicator = document.createElement('div');
    circleIndicator.className = 'circle-indicator';
    return circleIndicator;
  }

  static createDragHandle() {
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    
    for (let i = 0; i < 6; i++) {
      const dot = document.createElement('span');
      dot.className = 'drag-handle-dot';
      dragHandle.appendChild(dot);
    }
    
    return dragHandle;
  }

  static createStaticMathElement() {
    const staticMath = document.createElement('div');
    staticMath.className = 'math-field';
    return staticMath;
  }

  static createMathFieldElement() {
    const mathFieldElement = document.createElement('div');
    mathFieldElement.className = 'math-field';
    return mathFieldElement;
  }

  static recreateContainerStructure(container) {
    container.innerHTML = '';

    const circleIndicator = this.createCircleIndicator();
    container.appendChild(circleIndicator);

    const dragHandle = this.createDragHandle();
    container.appendChild(dragHandle);

    return { circleIndicator, dragHandle };
  }

  static insertElementAfterHandle(container, element) {
    const handle = container.querySelector(':scope > .drag-handle');
    if (handle) {
      container.insertBefore(element, handle.nextSibling);
    } else {
      container.appendChild(element);
    }
  }

  static isEmpty(latexContent) {
    return latexContent === "" || latexContent === "\\placeholder";
  }

  static hasTextContent(latex) {
    return latex.includes('\\text{') || latex.includes('\\\\text{');
  }

  static isDragHandleClicked(event) {
    return event.target.closest('.drag-handle');
  }

  static getBaseMathQuillConfig() {
    return {
      spaceBehavesLikeTab: false,
      restrictMismatchedBrackets: false,
      sumStartsWithNEquals: true,
      charsThatBreakOutOfSupSub: '+-=<>',
      autoSubscriptNumerals: true,
      autoCommands: 'pi theta sqrt nthroot int sum prod coprod infty infinity',
      autoOperatorNames: 'sin cos tan csc sec cot sinh cosh tanh csch sech coth log ln lim mod lcm gcd nPr nCr'
    };
  }

  static getEditMathQuillConfig() {
    return {
      spaceBehavesLikeTab: false,
      handlers: {}
    };
  }

  static validateMathGroupElement(mathGroup) {
    if (!mathGroup?.element) {
      throw new Error('MathGroup element is required');
    }
  }

  static canEdit(container) {
    return !container.querySelector('.mq-editable-field');
  }

  static recreateStaticContainer(container, latex) {
    this.recreateContainerStructure(container);
    const staticMath = this.createStaticMathElement();
    container.appendChild(staticMath);
    MQ.StaticMath(staticMath).latex(latex);
  }
}
