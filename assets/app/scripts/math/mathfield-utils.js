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

  static clearMathGroupSelections() {
    document.querySelectorAll('.math-group').forEach((group) => group.classList.remove('selected'));
  }

  static clearSelectedFields() {
    document.querySelectorAll('.math-field-container.selected-field')
      .forEach(el => el.classList.remove('selected-field'));
  }

  static markContainerAsSelected(container) {
    this.clearSelectedFields();
    container.classList.add('selected-field');
  }

  static isEmpty(latexContent) {
    return latexContent === "" || latexContent === "\\placeholder";
  }

  static hasTextContent(latex) {
    return latex.includes('\\text{') || latex.includes('\\\\text{');
  }

  static canNavigateToPrevious(container, groupElement) {
    return groupElement.children.length > 1 && container !== groupElement.firstElementChild;
  }

  static isCurrentlyEditing(container) {
    return !!container.querySelector(':scope > .mq-editable-field');
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

  static highlightGroupExpressions(container) {
    if (window.expressionEquivalence && container.dataset.groupKey) {
      window.expressionEquivalence.highlightGroupExpressions(container.dataset.groupKey, true);
    }
  }

  static processEquivalenceColors(container, hasText) {
    if (window.expressionEquivalence && !hasText) {
      window.expressionEquivalence.applyIndicatorColors();
      if (container.dataset.groupKey) {
        window.expressionEquivalence.highlightGroupExpressions(container.dataset.groupKey, false);
      } else {
        window.expressionEquivalence.removeAllHighlights();
      }
    }
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
