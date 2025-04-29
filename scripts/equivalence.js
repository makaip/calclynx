class ExpressionEquivalence {
  constructor() {
    // Check if MathGene is loaded
    if (typeof mgCalc === 'undefined') {
      console.error('MathGene calculator (mgCalc) is not loaded. Expression equivalence detection will not work.');
      this.mathGeneLoaded = false; // Flag to indicate MathGene status
    } else {
      this.mathGeneLoaded = true;
    }
    this.identicalColorsCache = new Map();
    this.equivalentColorsCache = new Map();
    this.normalizationCache = new Map();

    document.addEventListener('click', (event) => {
      this.removeAllHighlights();
      const container = event.target.closest('.math-field-container');
      // Use the new data attribute and method name
      if (container && container.dataset.groupKey) {
        this.highlightGroupExpressions(container.dataset.groupKey, true);
      }
    });
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

      // Skip normalization for text expressions
      if (/(\\text|text)\{/.test(latexExpression)) {
        console.log("[DEBUG] Skipping normalization for text expression:", latexExpression);
        return null;
      }

      // Only compute if not cached
      if (this.normalizationCache.has(latexExpression)) {
        return this.normalizationCache.get(latexExpression);
      }
      
      // First, expand the expression
      const expanded = mgCalc.Expand(latexExpression);
      if (!expanded || !expanded.latex) {
          // If expansion fails or returns nothing, try simplifying the original
          // console.warn(`Expansion failed for "${latexExpression}", attempting direct simplification.`); // Optional logging
          const simplifiedDirectly = mgCalc.Simplify(latexExpression);
          const normalizedLatex = simplifiedDirectly ? simplifiedDirectly.latex : latexExpression;
          this.normalizationCache.set(latexExpression, normalizedLatex);
          return normalizedLatex;
      }

      // Then, simplify the expanded expression
      const simplified = mgCalc.Simplify(expanded.latex);
      // Ensure simplification returns a latex string
      const normalizedLatex = simplified && simplified.latex ? simplified.latex : expanded.latex;
      this.normalizationCache.set(latexExpression, normalizedLatex);
      return normalizedLatex; 
    } catch (error) {
      console.warn(`Could not normalize "${latexExpression}" after expand/simplify: ${error.message}`);
      // Fallback: try simplifying the original directly if expand/simplify chain failed
      try {
          const simplifiedDirectly = mgCalc.Simplify(latexExpression);
          // Ensure simplification returns a latex string
          const normalizedLatex = simplifiedDirectly && simplifiedDirectly.latex ? simplifiedDirectly.latex : latexExpression;
          this.normalizationCache.set(latexExpression, normalizedLatex);
          return normalizedLatex; 
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
        // Normalized (only if MathGene is loaded)
        if (this.mathGeneLoaded) {
            const norm = this.normalizeExpression(originalLatex);
            if (norm) {
              if (!normalizedMap.has(norm)) normalizedMap.set(norm, []);
              normalizedMap.get(norm).push(field);
            }
        }
      });
    });

    // Generate colors for identical keys (only needed if MathGene isn't loaded or for purely identical groups)
    for (const key of identicalMap.keys()) {
        if (identicalMap.get(key).length > 1) { // Only generate if it's actually a group
            if (!this.identicalColorsCache.has(key)) {
                this.identicalColorsCache.set(key, this.getRandomColor());
            }
            identicalColors.set(key, this.identicalColorsCache.get(key));
        }
    }
    // Generate colors for normalized keys (if MathGene is loaded)
    if (this.mathGeneLoaded) {
        for (const key of normalizedMap.keys()) {
            if (normalizedMap.get(key).length > 1) { // Only generate if it's actually a group
                if (!this.equivalentColorsCache.has(key)) {
                    this.equivalentColorsCache.set(key, this.getRandomColor());
                }
                equivalentColors.set(key, this.equivalentColorsCache.get(key));
            }
        }
    }


    // Now assign circle classes and colors
    mathGroups.forEach((group) => {
      group.querySelectorAll('.math-field-container').forEach((field) => {
        const expr = field.dataset.latex || '';
        // Get normalized form only if MathGene is loaded
        const norm = this.mathGeneLoaded ? (this.normalizeExpression(expr) || '') : '';
        const identicalArr = identicalMap.get(expr);
        // Get equivalent array only if MathGene is loaded and normalization succeeded
        const eqArr = this.mathGeneLoaded && norm ? normalizedMap.get(norm) : null;

        // Determine if part of a group
        const isIdenticalGroup = identicalArr && identicalArr.length > 1;
        const isEquivalentGroup = eqArr && eqArr.length > 1;

        const circle = field.querySelector('.circle-indicator');
        if (!circle) return;

        // Clear existing classes and styles
        circle.classList.remove('identical', 'equivalent');
        field.classList.remove('group-editing'); // Use new class name
        field.style.removeProperty('--circle-color');
        delete field.dataset.groupKey; // Remove old/new data attribute
        delete field.dataset.identicalExpr; // Clean up old attribute just in case

        let color;
        let groupKey;
        let groupClass;

        // Prioritize Equivalent Grouping if available and MathGene is loaded
        if (this.mathGeneLoaded && isEquivalentGroup) {
            color = equivalentColors.get(norm);
            groupKey = norm; // Use normalized form as the key for the equivalent group
            groupClass = 'equivalent';
        }
        // Fallback to Identical Grouping if not part of an equivalent group (or MathGene not loaded)
        else if (isIdenticalGroup) {
            color = identicalColors.get(expr);
            groupKey = expr; // Use original expression as the key for the purely identical group
            groupClass = 'identical';
        }

        // Apply color and class if part of any group
        if (color && groupKey && groupClass) {
            circle.classList.add(groupClass);
            field.style.setProperty('--circle-color', color);
            // Store the key used for grouping/coloring/highlighting
            field.dataset.groupKey = groupKey;
        }
      });
    });
  }

  // Renamed method to handle highlighting based on group key
  highlightGroupExpressions(groupKey, highlight) {
    if (!groupKey) return;
    // Escape quotes within the attribute selector value if necessary
    const escapedGroupKey = groupKey.replace(/"/g, '\\"');
    // Select using the new data attribute
    const containers = document.querySelectorAll(`.math-field-container[data-group-key="${escapedGroupKey}"]`);
    containers.forEach((c) => {
      // Use the new class name
      if (highlight) c.classList.add('group-editing');
      else c.classList.remove('group-editing');
    });
  }

  removeAllHighlights() {
    // Select using the new class name
    const containers = document.querySelectorAll('.math-field-container.group-editing');
    containers.forEach((c) => c.classList.remove('group-editing'));
  }
}
