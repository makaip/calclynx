class ExpressionEquivalence {
  constructor() {
    if (typeof mgCalc === 'undefined') {
      console.error('MathGene calculator (mgCalc) is not loaded. Expression equivalence detection will not work.');
      this.mathGeneLoaded = false;
    } else {
      this.mathGeneLoaded = true;
    }
    this.identicalColorsCache = new Map();
    this.equivalentColorsCache = new Map();
    this.normalizationCache = new Map();

    document.addEventListener('click', (event) => {
      this.removeAllHighlights();
      const container = event.target.closest('.math-field-container');
      if (container && container.dataset.groupKey) {
        this.highlightGroupExpressions(container.dataset.groupKey, true);
      }
    });
  }

  normalizeExpression(latexExpression) {
    if (!this.mathGeneLoaded) {
        return latexExpression;
    }
    try {
        if (!latexExpression || latexExpression.trim() === '') return null;

        if (latexExpression.includes('\\text')) {
            return null;
        }

        if (this.normalizationCache.has(latexExpression)) {
            return this.normalizationCache.get(latexExpression);
        }
        
        const expanded = mgCalc.Expand(latexExpression);
        if (!expanded || !expanded.latex) {
            const simplifiedDirectly = mgCalc.Simplify(latexExpression);
            const normalizedLatex = simplifiedDirectly ? simplifiedDirectly.latex : latexExpression;
            this.normalizationCache.set(latexExpression, normalizedLatex);
            return normalizedLatex;
        }

        const simplified = mgCalc.Simplify(expanded.latex);
        const normalizedLatex = simplified && simplified.latex ? simplified.latex : expanded.latex;
        this.normalizationCache.set(latexExpression, normalizedLatex);
        return normalizedLatex; 
    } catch (error) {
        try {
            const simplifiedDirectly = mgCalc.Simplify(latexExpression);
            const normalizedLatex = simplifiedDirectly && simplifiedDirectly.latex ? simplifiedDirectly.latex : latexExpression;
            this.normalizationCache.set(latexExpression, normalizedLatex);
            return normalizedLatex; 
        } catch (innerError) {
            return latexExpression;
        }
    }
  }

  logEquivalentExpressions() {
    const mathGroups = document.querySelectorAll('.math-group');
    const identicalMap = new Map();
    const normalizedMap = new Map();
    let groupCounter = 0;

    mathGroups.forEach((group, groupIndex) => {
      const mathFields = group.querySelectorAll('.math-field-container');
      
      mathFields.forEach((field, fieldIndex) => {
        const originalLatex = field.dataset.latex;
        if (!originalLatex || originalLatex.trim() === '') return;

        if (originalLatex.includes('\\text')) {
          return;
        }
        
        const location = { groupIndex, fieldIndex, expression: originalLatex };

        if (!identicalMap.has(originalLatex)) {
          identicalMap.set(originalLatex, [location]);
        } else {
          identicalMap.get(originalLatex).push(location);
        }

        const normalizedLatex = this.normalizeExpression(originalLatex);
        if (!normalizedLatex) return;

        if (!normalizedMap.has(normalizedLatex)) {
          normalizedMap.set(normalizedLatex, [location]);
        } else {
          normalizedMap.get(normalizedLatex).push(location);
        }
      });
    });

    let loggedSomething = false;

    for (const [_, locations] of identicalMap) {
      if (locations.length > 1) {
        const formattedGroup = {};
        locations.forEach(loc => {
          const key = `MathGroup ${loc.groupIndex}: Index ${loc.fieldIndex}`; 
          formattedGroup[key] = loc.expression;
        });
        groupCounter++;
        loggedSomething = true;
      }
    }

    if (this.mathGeneLoaded) {
        for (const [normalizedKey, locations] of normalizedMap) {
          if (locations.length > 1) {
            const isPurelyIdenticalGroup = identicalMap.has(locations[0].expression) && identicalMap.get(locations[0].expression).length === locations.length;

            if (!isPurelyIdenticalGroup) {
                const formattedGroup = {};
                locations.forEach(loc => {
                    const key = `MathGroup ${loc.groupIndex}: Index ${loc.fieldIndex}`; 
                    formattedGroup[key] = loc.expression;
                });
                groupCounter++;
                loggedSomething = true;
            }
          }
        }
    }

    if (!loggedSomething) {
    }
  }

  getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  applyIndicatorColors() {
    const identicalColors = new Map();
    const equivalentColors = new Map();

    const identicalMap = new Map();
    const normalizedMap = new Map();
    const mathGroups = document.querySelectorAll('.math-group');
    mathGroups.forEach((group, groupIndex) => {
      group.querySelectorAll('.math-field-container').forEach((field, fieldIndex) => {
        const originalLatex = field.dataset.latex;
        if (!originalLatex || !originalLatex.trim()) return;

        if (originalLatex.includes('\\text')) {
          return;
        }

        if (!identicalMap.has(originalLatex)) {
          identicalMap.set(originalLatex, []);
        }
        identicalMap.get(originalLatex).push(field);
        if (this.mathGeneLoaded) {
            const norm = this.normalizeExpression(originalLatex);
            if (norm) {
              if (!normalizedMap.has(norm)) normalizedMap.set(norm, []);
              normalizedMap.get(norm).push(field);
            }
        }
      });
    });

    for (const key of identicalMap.keys()) {
        if (identicalMap.get(key).length > 1) {
            if (!this.identicalColorsCache.has(key)) {
                this.identicalColorsCache.set(key, this.getRandomColor());
            }
            identicalColors.set(key, this.identicalColorsCache.get(key));
        }
    }
    if (this.mathGeneLoaded) {
        for (const key of normalizedMap.keys()) {
            if (normalizedMap.get(key).length > 1) {
                if (!this.equivalentColorsCache.has(key)) {
                    this.equivalentColorsCache.set(key, this.getRandomColor());
                }
                equivalentColors.set(key, this.equivalentColorsCache.get(key));
            }
        }
    }

    mathGroups.forEach((group) => {
      group.querySelectorAll('.math-field-container').forEach((field) => {
        const expr = field.dataset.latex || '';
        const norm = this.mathGeneLoaded ? (this.normalizeExpression(expr) || '') : '';
        const identicalArr = identicalMap.get(expr);
        const eqArr = this.mathGeneLoaded && norm ? normalizedMap.get(norm) : null;

        const isIdenticalGroup = identicalArr && identicalArr.length > 1;
        const isEquivalentGroup = eqArr && eqArr.length > 1;

        const circle = field.querySelector('.circle-indicator');
        if (!circle) return;

        circle.classList.remove('identical', 'equivalent');
        field.classList.remove('group-editing');
        field.style.removeProperty('--circle-color');
        delete field.dataset.groupKey;
        delete field.dataset.identicalExpr;

        let color;
        let groupKey;
        let groupClass;

        if (this.mathGeneLoaded && isEquivalentGroup) {
            color = equivalentColors.get(norm);
            groupKey = norm;
            groupClass = 'equivalent';
        } else if (isIdenticalGroup) {
            color = identicalColors.get(expr);
            groupKey = expr;
            groupClass = 'identical';
        }

        if (color && groupKey && groupClass) {
            circle.classList.add(groupClass);
            field.style.setProperty('--circle-color', color);
            field.dataset.groupKey = groupKey;
        }
      });
    });
  }

  highlightGroupExpressions(groupKey, highlight) {
    if (!groupKey) return;
    const escapedGroupKey = groupKey.replace(/"/g, '\\"');
    const containers = document.querySelectorAll(`.math-field-container[data-group-key="${escapedGroupKey}"]`);
    containers.forEach((c) => {
      if (highlight) c.classList.add('group-editing');
      else c.classList.remove('group-editing');
    });
  }

  removeAllHighlights() {
    const containers = document.querySelectorAll('.math-field-container.group-editing');
    containers.forEach((c) => c.classList.remove('group-editing'));
  }
}
