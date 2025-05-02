class ExpressionEquivalence {
  constructor() {
    // Check if mgCalc exists globally for initial setup, but worker availability is key
    this.mathGeneGloballyLoaded = typeof mgCalc !== 'undefined';
    this.identicalColorsCache = new Map();
    this.equivalentColorsCache = new Map();
    this.normalizationCache = new Map(); // Cache stores normalized LaTeX or null
    this.normalizationTimeout = 5000; // 5 seconds timeout
    this.pendingNormalizations = new Map(); // Map<requestId, { resolve, timeoutHandle, originalLatex }>
    this.nextRequestId = 0;
    this.worker = null;
    this.workerAvailable = false;

    try {
        // Path to worker script. Ensure this path is correct relative to the HTML file.
        this.worker = new Worker('assets/app/scripts/mathgene-worker.js');
        this.workerAvailable = true; // Assume available until an error occurs

        this.worker.onmessage = (event) => {
            const { id, result, error } = event.data;
            if (this.pendingNormalizations.has(id)) {
                const { resolve, timeoutHandle, originalLatex } = this.pendingNormalizations.get(id);
                clearTimeout(timeoutHandle); // Clear the timeout

                // Resolve to null if there was an error reported by the worker,
                // or if the worker explicitly sent null (meaning no change/failure).
                const finalResult = error ? null : result;

                this.normalizationCache.set(originalLatex, finalResult); // Cache result (or null)
                resolve(finalResult); // Resolve the promise
                this.pendingNormalizations.delete(id); // Clean up

                // Optional: Log worker errors for debugging
                // if (error) {
                //     console.warn(`Worker normalization error for ${originalLatex}: ${error}`);
                // }
            }
        };

        this.worker.onerror = (error) => {
            console.error('Error initializing or running MathGene worker:', error);
            this.workerAvailable = false; // Worker failed, disable equivalence features

            // Reject all pending promises by resolving them with null
            this.pendingNormalizations.forEach(({ resolve, timeoutHandle, originalLatex }, id) => {
                clearTimeout(timeoutHandle);
                console.warn(`Resolving normalization for ${originalLatex} as null due to worker error.`);
                this.normalizationCache.set(originalLatex, null); // Cache failure
                resolve(null);
            });
            this.pendingNormalizations.clear();
        };

        // Optional: Check if MathGene is actually loaded after a short delay,
        // in case the global check was too early.
        // setTimeout(() => {
        //     if (typeof mgCalc === 'undefined') {
        //         console.error('mgCalc still not loaded after delay. Worker might fail.');
        //         // No need to disable worker here, its own check will handle it.
        //     }
        // }, 500);


    } catch (e) {
         console.error("Failed to create MathGene worker. Equivalence checking disabled.", e);
         this.workerAvailable = false;
    }

    document.addEventListener('click', (event) => {
      this.removeAllHighlights();
      const container = event.target.closest('.math-field-container');
      if (container && container.dataset.groupKey) {
        this.highlightGroupExpressions(container.dataset.groupKey, true);
      }
    });
  }

  async normalizeExpression(latexExpression) {
    // Cannot normalize if worker isn't running, or input is invalid/text.
    if (!this.workerAvailable || !latexExpression || latexExpression.trim() === '' || latexExpression.includes('\\text')) {
      return null; // Return null signifies normalization cannot/should not be done
    }

    // Return cached result if available (could be normalized string or null)
    if (this.normalizationCache.has(latexExpression)) {
      return this.normalizationCache.get(latexExpression);
    }

    const requestId = this.nextRequestId++;

    return new Promise((resolve) => {
        const timeoutHandle = setTimeout(() => {
            if (this.pendingNormalizations.has(requestId)) {
                // console.warn(`Normalization timed out (>${this.normalizationTimeout}ms) for: ${latexExpression}`);
                this.normalizationCache.set(latexExpression, null); // Cache timeout as null
                resolve(null); // Resolve with null on timeout
                this.pendingNormalizations.delete(requestId);
                // Note: We don't terminate the worker here, just abandon this request.
                // The worker might eventually finish, but its result will be ignored.
            }
        }, this.normalizationTimeout);

        // Store resolve function, timeout handle, and original LaTeX
        this.pendingNormalizations.set(requestId, { resolve, timeoutHandle, originalLatex: latexExpression });

        // Send task to worker
        try {
             this.worker.postMessage({ id: requestId, latex: latexExpression });
        } catch (postError) {
             // Handle potential error if worker terminated unexpectedly
             console.error(`Error posting message to worker for ${latexExpression}:`, postError);
             clearTimeout(timeoutHandle);
             this.normalizationCache.set(latexExpression, null); // Cache failure
             resolve(null);
             this.pendingNormalizations.delete(requestId);
             this.workerAvailable = false; // Mark worker as unavailable
        }
    });
  }

  async logEquivalentExpressions() {
    const mathGroups = document.querySelectorAll('.math-group');
    const identicalMap = new Map();
    const normalizedMap = new Map(); // Map<normalizedLatex, Array<location>>
    let groupCounter = 0;

    const fieldsToProcess = [];
    mathGroups.forEach((group, groupIndex) => {
      group.querySelectorAll('.math-field-container').forEach((field, fieldIndex) => {
        const originalLatex = field.dataset.latex;
        // Basic filtering: must have non-empty LaTeX, cannot contain \text
        if (originalLatex && originalLatex.trim() !== '' && !originalLatex.includes('\\text')) {
          fieldsToProcess.push({ field, originalLatex, groupIndex, fieldIndex });
        }
      });
    });

    // If the worker isn't available, skip all normalization attempts
    if (!this.workerAvailable) {
        console.warn("logEquivalentExpressions: Worker not available, skipping normalization.");
        // Proceed with only identical checks
        fieldsToProcess.forEach(item => {
            const { originalLatex, groupIndex, fieldIndex } = item;
            const location = { groupIndex, fieldIndex, expression: originalLatex };
            if (!identicalMap.has(originalLatex)) identicalMap.set(originalLatex, []);
            identicalMap.get(originalLatex).push(location);
        });
    } else {
        // Normalize all valid expressions concurrently using the worker
        const normalizationPromises = fieldsToProcess.map(item =>
          this.normalizeExpression(item.originalLatex).then(normalized => ({ ...item, normalizedLatex: normalized })) // normalized can be null
        );

        const processedFields = await Promise.all(normalizationPromises);

        // Build maps from processed results
        processedFields.forEach(item => {
          const { originalLatex, normalizedLatex, groupIndex, fieldIndex } = item;
          const location = { groupIndex, fieldIndex, expression: originalLatex };

          // Identical map (always add based on original LaTeX)
          if (!identicalMap.has(originalLatex)) {
            identicalMap.set(originalLatex, []);
          }
          identicalMap.get(originalLatex).push(location);

          // Normalized map (only add if normalization succeeded and produced a non-null result)
          if (normalizedLatex) { // Check for non-null result
              if (!normalizedMap.has(normalizedLatex)) {
                normalizedMap.set(normalizedLatex, []);
              }
              normalizedMap.get(normalizedLatex).push(location);
          }
        });
    }


    // --- Logging Logic ---
    let loggedSomething = false;

    // Log Identical Groups
    for (const [_, locations] of identicalMap) {
      if (locations.length > 1) {
        const formattedGroup = {};
        locations.forEach(loc => {
          const key = `MathGroup ${loc.groupIndex}: Index ${loc.fieldIndex}`;
          formattedGroup[key] = loc.expression;
        });
        // console.log(`Identical Group ${++groupCounter}:`, formattedGroup); // Example logging
        loggedSomething = true;
      }
    }

    // Log Equivalent Groups (that are not purely identical)
    // Only proceed if the worker was available and normalization could have happened
    if (this.workerAvailable) {
        for (const [normalizedKey, locations] of normalizedMap) {
          if (locations.length > 1) {
            // Check if all expressions in this normalized group are identical to the first one
            const firstOriginalExpr = locations[0].expression;
            // Use the identicalMap to see if this group corresponds exactly to an identical group
            const identicalGroupForFirstExpr = identicalMap.get(firstOriginalExpr);
            const isPurelyIdenticalGroup = identicalGroupForFirstExpr &&
                                           identicalGroupForFirstExpr.length === locations.length &&
                                           locations.every(loc => loc.expression === firstOriginalExpr);


            // Only log if it's a true equivalence group (mixed originals)
            if (!isPurelyIdenticalGroup) {
                const formattedGroup = {};
                locations.forEach(loc => {
                    const key = `MathGroup ${loc.groupIndex}: Index ${loc.fieldIndex}`;
                    formattedGroup[key] = loc.expression;
                });
                // console.log(`Equivalent Group ${++groupCounter} (Normalized: ${normalizedKey}):`, formattedGroup); // Example logging
                loggedSomething = true;
            }
          }
        }
    }

    // if (!loggedSomething) {
    //     console.log("No identical or equivalent groups found."); // Example logging
    // }
  }

  getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  async applyIndicatorColors() {
    const identicalColors = new Map();
    const equivalentColors = new Map();
    const identicalMap = new Map(); // Map<originalLatex, Array<fieldElement>>
    const normalizedMap = new Map(); // Map<normalizedLatex, Array<fieldElement>>
    const mathGroups = document.querySelectorAll('.math-group');

    const fieldsToProcess = [];
    // First pass: Clear existing indicators and collect fields to process
    mathGroups.forEach((group) => {
      group.querySelectorAll('.math-field-container').forEach((field) => {
        // Clear previous state immediately
        const circle = field.querySelector('.circle-indicator');
        if (circle) circle.classList.remove('identical', 'equivalent');
        field.classList.remove('group-editing');
        field.style.removeProperty('--circle-color');
        delete field.dataset.groupKey;
        // delete field.dataset.identicalExpr; // This wasn't used previously, removing

        const originalLatex = field.dataset.latex;
        // Basic filtering: must have non-empty LaTeX, cannot contain \text
        if (originalLatex && originalLatex.trim() !== '' && !originalLatex.includes('\\text')) {
          fieldsToProcess.push({ field, originalLatex });
        }
      });
    });

    let processedFields = [];

    // If the worker isn't available, skip normalization
    if (!this.workerAvailable) {
        // console.warn("applyIndicatorColors: Worker not available, skipping normalization.");
        processedFields = fieldsToProcess.map(item => ({ ...item, normalizedLatex: null }));
    } else {
        // Normalize all valid expressions concurrently using the worker
        const normalizationPromises = fieldsToProcess.map(item =>
          this.normalizeExpression(item.originalLatex).then(normalized => ({ ...item, normalizedLatex: normalized })) // normalized can be null
        );
        processedFields = await Promise.all(normalizationPromises);
    }


    // Build maps from processed results
    processedFields.forEach(item => {
      const { field, originalLatex, normalizedLatex } = item;

      // Identical map (always based on original LaTeX)
      if (!identicalMap.has(originalLatex)) {
        identicalMap.set(originalLatex, []);
      }
      identicalMap.get(originalLatex).push(field);

      // Normalized map (only add if normalization succeeded and produced a non-null result)
      if (this.workerAvailable && normalizedLatex) { // Check worker and non-null result
          if (!normalizedMap.has(normalizedLatex)) {
            normalizedMap.set(normalizedLatex, []);
          }
          normalizedMap.get(normalizedLatex).push(field);
      }
    });

    // Assign colors to groups
    // Identical groups
    for (const [key, fields] of identicalMap) {
      if (fields.length > 1) {
        if (!this.identicalColorsCache.has(key)) {
          this.identicalColorsCache.set(key, this.getRandomColor());
        }
        identicalColors.set(key, this.identicalColorsCache.get(key));
      }
    }
    // Equivalent groups (only if worker is available)
    if (this.workerAvailable) {
        for (const [key, fields] of normalizedMap) {
             if (fields.length > 1) {
                // Check if this normalized group isn't just a duplicate of an identical group
                // A group is purely identical if all its members have the same original LaTeX
                const firstFieldOriginalLatex = fields[0].dataset.latex;
                const isPurelyIdentical = fields.every(f => f.dataset.latex === firstFieldOriginalLatex);

                // Assign color only if it's a group of more than one, AND it's not purely identical
                // (meaning it contains expressions that simplified to the same form but weren't identical originally)
                if (!isPurelyIdentical) {
                    if (!this.equivalentColorsCache.has(key)) {
                        this.equivalentColorsCache.set(key, this.getRandomColor());
                    }
                    equivalentColors.set(key, this.equivalentColorsCache.get(key));
                }
            }
        }
    }

    // Apply colors and classes to fields based on the maps
    processedFields.forEach(item => {
      const { field, originalLatex, normalizedLatex } = item; // normalizedLatex can be null
      const circle = field.querySelector('.circle-indicator');
      if (!circle) return;

      let color;
      let groupKey;
      let groupClass;

      // Determine if it belongs to a *true* equivalent group (normalized, color assigned in equivalentColors)
      const isTrueEquivalentGroup = this.workerAvailable &&
                                    normalizedLatex &&
                                    equivalentColors.has(normalizedLatex); // Check if a color was assigned specifically for equivalence

      if (isTrueEquivalentGroup) {
        color = equivalentColors.get(normalizedLatex);
        groupKey = normalizedLatex; // Group key is the normalized form
        groupClass = 'equivalent';
      } else {
        // Fallback to identical highlighting if applicable (part of a group of >1 identical expressions)
        const isIdenticalGroup = identicalColors.has(originalLatex); // Check if color was assigned for identical group
        if (isIdenticalGroup) {
          color = identicalColors.get(originalLatex);
          groupKey = originalLatex; // Group key is the original form
          groupClass = 'identical';
        }
      }

      // Apply the determined style if any group was found
      if (color && groupKey && groupClass) {
        circle.classList.add(groupClass);
        field.style.setProperty('--circle-color', color);
        field.dataset.groupKey = groupKey;
      }
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
