class ExpressionEquivalence {
  constructor() {
    // Check if MathGene is loaded
    if (typeof mgCalc === 'undefined') {
      console.error('MathGene calculator (mgCalc) is not loaded. Expression equivalence detection will not work.');
      this.mathGeneLoaded = false; // Flag to indicate MathGene status
    } else {
      this.mathGeneLoaded = true;
    }
  }

  // Normalize expression using MathGene's expansion and simplification
  normalizeExpression(latexExpression) {
    // Only attempt normalization if MathGene is loaded
    if (!this.mathGeneLoaded) {
        return latexExpression; // Return original if MathGene isn't available
    }
    try {
      // Skip empty expressions
      if (!latexExpression || latexExpression.trim() === '') return null;
      
      // First, expand the expression
      const expanded = mgCalc.Expand(latexExpression);
      if (!expanded || !expanded.latex) {
          // If expansion fails or returns nothing, try simplifying the original
          // console.warn(`Expansion failed for "${latexExpression}", attempting direct simplification.`); // Optional logging
          const simplifiedDirectly = mgCalc.Simplify(latexExpression);
          return simplifiedDirectly ? simplifiedDirectly.latex : latexExpression;
      }

      // Then, simplify the expanded expression
      const simplified = mgCalc.Simplify(expanded.latex);
      // Ensure simplification returns a latex string
      return simplified && simplified.latex ? simplified.latex : expanded.latex; 
    } catch (error) {
      console.warn(`Could not normalize "${latexExpression}" after expand/simplify: ${error.message}`);
      // Fallback: try simplifying the original directly if expand/simplify chain failed
      try {
          const simplifiedDirectly = mgCalc.Simplify(latexExpression);
          // Ensure simplification returns a latex string
          return simplifiedDirectly && simplifiedDirectly.latex ? simplifiedDirectly.latex : latexExpression; 
      } catch (innerError) {
          console.warn(`Direct simplification also failed for "${latexExpression}": ${innerError.message}`);
          return latexExpression; // Return original as last resort
      }
    }
  }

  // Log identical and equivalent expressions
  logEquivalentExpressions() {
    const mathGroups = document.querySelectorAll('.math-group');
    const identicalMap = new Map();
    const normalizedMap = new Map();
    let groupCounter = 0; // Counter for unique group logging

    // --- Pass 1: Build maps for identical and normalized expressions ---
    mathGroups.forEach((group, groupIndex) => {
      const mathFields = group.querySelectorAll('.math-field-container');
      
      mathFields.forEach((field, fieldIndex) => {
        const originalLatex = field.dataset.latex;
        if (!originalLatex || originalLatex.trim() === '') return;
        
        const location = { groupIndex, fieldIndex, expression: originalLatex };

        // Map for identical expressions (using original LaTeX as key)
        if (!identicalMap.has(originalLatex)) {
          identicalMap.set(originalLatex, [location]);
        } else {
          identicalMap.get(originalLatex).push(location);
        }

        // Map for equivalent expressions (using normalized LaTeX as key)
        const normalizedLatex = this.normalizeExpression(originalLatex);
        if (!normalizedLatex) return; // Skip if normalization failed completely

        if (!normalizedMap.has(normalizedLatex)) {
          normalizedMap.set(normalizedLatex, [location]);
        } else {
          normalizedMap.get(normalizedLatex).push(location);
        }
      });
    });

    let loggedSomething = false;

    // --- Pass 2: Log Identical Groups ---
    console.log("--- Checking for Identical Expressions ---");
    for (const [_, locations] of identicalMap) {
      if (locations.length > 1) {
        const formattedGroup = {};
        locations.forEach(loc => {
          const key = `MathGroup ${loc.groupIndex}: Index ${loc.fieldIndex}`; 
          formattedGroup[key] = loc.expression;
        });
        groupCounter++;
        console.log(`Identical Expression Group ${groupCounter}:`, formattedGroup); 
        loggedSomething = true;
      }
    }

    // --- Pass 3: Log Equivalent Groups (only if MathGene is loaded) ---
    if (this.mathGeneLoaded) {
        console.log("--- Checking for Equivalent Expressions (using MathGene) ---");
        for (const [normalizedKey, locations] of normalizedMap) {
          if (locations.length > 1) {
            // Optional: Check if this group consists *only* of expressions already logged as identical
            // This avoids logging the same group twice if all members are identical.
            const isPurelyIdenticalGroup = identicalMap.has(locations[0].expression) && identicalMap.get(locations[0].expression).length === locations.length;

            if (!isPurelyIdenticalGroup) {
                const formattedGroup = {};
                locations.forEach(loc => {
                    const key = `MathGroup ${loc.groupIndex}: Index ${loc.fieldIndex}`; 
                    formattedGroup[key] = loc.expression; // Log original expression
                });
                groupCounter++;
                console.log(`Equivalent Expression Group ${groupCounter} (Normalized to: ${normalizedKey}):`, formattedGroup); 
                loggedSomething = true;
            }
          }
        }
    } else {
        console.log("--- Skipping Equivalent Expression check (MathGene not loaded) ---");
    }

    if (!loggedSomething) {
        console.log("--- No identical or equivalent expressions found. ---");
    }
    console.log("--- Equivalence Check Complete ---"); // Add a footer for clarity
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
    // Assign a color to each identical group and each normalized group, then apply to containers.
    const identicalColors = new Map();
    const equivalentColors = new Map();

    // Rebuild identicalMap and normalizedMap for all fields (similar to logEquivalentExpressions).
    const identicalMap = new Map();
    const normalizedMap = new Map();
    const mathGroups = document.querySelectorAll('.math-group');
    mathGroups.forEach((group, groupIndex) => {
      group.querySelectorAll('.math-field-container').forEach((field, fieldIndex) => {
        const originalLatex = field.dataset.latex;
        if (!originalLatex || !originalLatex.trim()) return;
        // Identical
        if (!identicalMap.has(originalLatex)) {
          identicalMap.set(originalLatex, []);
        }
        identicalMap.get(originalLatex).push(field);
        // Normalized
        const norm = this.normalizeExpression(originalLatex);
        if (norm) {
          if (!normalizedMap.has(norm)) normalizedMap.set(norm, []);
          normalizedMap.get(norm).push(field);
        }
      });
    });

    // Generate colors for identical keys
    for (const key of identicalMap.keys()) {
      identicalColors.set(key, this.getRandomColor());
    }
    // Generate colors for normalized keys
    for (const key of normalizedMap.keys()) {
      equivalentColors.set(key, this.getRandomColor());
    }

    // Now assign circle classes and colors
    mathGroups.forEach((group) => {
      group.querySelectorAll('.math-field-container').forEach((field) => {
        const expr = field.dataset.latex || '';
        const norm = this.normalizeExpression(expr) || '';
        const identicalArr = identicalMap.get(expr);
        const eqArr = normalizedMap.get(norm);
        const isIdentical = identicalArr && identicalArr.length > 1;
        const isEquivalent = eqArr && eqArr.length > 1;
        const circle = field.querySelector('.circle-indicator');
        if (!circle) return;

        // Clear existing classes
        circle.classList.remove('identical', 'equivalent');
        field.classList.remove('identical-editing');
        field.style.removeProperty('--circle-color');

        if (!isIdentical && !isEquivalent) {
          // No shared color needed
          return;
        }

        // If both identical & equivalent, use identical color (single color shared).
        let color;
        if (isIdentical) {
          color = identicalColors.get(expr);
          circle.classList.add('identical');
        } else {
          color = equivalentColors.get(norm);
          circle.classList.add('equivalent');
        }
        field.style.setProperty('--circle-color', color);
        // We'll store the originalLatex for "editing" toggling
        field.dataset.identicalExpr = expr;
      });
    });
  }

  highlightIdenticalExpressions(expr, highlight) {
    // Toggle .identical-editing on all containers with the given expression
    if (!expr) return;
    const containers = document.querySelectorAll(`.math-field-container[data-identical-expr="${expr}"]`);
    containers.forEach((c) => {
      if (highlight) c.classList.add('identical-editing');
      else c.classList.remove('identical-editing');
    });
  }
}
