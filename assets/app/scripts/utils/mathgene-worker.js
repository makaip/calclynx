// Import the necessary MathGene scripts into the worker's scope
// Paths are relative to the worker script's location
if (typeof self !== 'undefined' && typeof self.importScripts === 'function') {
    try {
        self.importScripts('../../../../libs/mathgene/mg_translate.js', '../../../../libs/mathgene/mg_calculate.js');
    } catch (e) {
        console.error('mathgene-worker: Failed to import MathGene scripts.', e);
        throw e;
    }
}

// This worker assumes mgCalc is loaded globally in its scope

self.onmessage = function(event) {
    const { id, latex } = event.data;

    // Check if mgCalc was actually available
    if (typeof mgCalc === 'undefined') {
        console.error('mathgene-worker: mgCalc is not defined in worker scope. Ensure worker script is loaded after MathGene libraries.');
        self.postMessage({ id, error: 'mgCalc not loaded in worker' });
        return;
    }

    let normalizedLatex = null; // Default to null (failure or no change)

    try {
        // Perform synchronous calculation within the worker
        const expanded = mgCalc.Expand(latex);
        let resultLatex = null;

        if (expanded && expanded.latex) {
            const simplified = mgCalc.Simplify(expanded.latex);
            resultLatex = simplified && simplified.latex ? simplified.latex : expanded.latex;
        } else {
            // If Expand failed, try Simplify directly
            const simplifiedDirectly = mgCalc.Simplify(latex);
            if (simplifiedDirectly && simplifiedDirectly.latex) {
                resultLatex = simplifiedDirectly.latex;
            }
        }

        // Only send back a result if normalization produced something different and valid
        // Send null if it's the same, null, or empty to signify no meaningful normalization for equivalence grouping
        if (resultLatex && resultLatex !== latex && resultLatex.trim() !== '') {
             normalizedLatex = resultLatex;
             self.postMessage({ id, result: normalizedLatex });
        } else {
             // If result is same as input, null, or empty, treat as failure/no change for equivalence purposes
             self.postMessage({ id, result: null, note: 'Normalization did not change expression, failed, or resulted in empty.' });
        }

    } catch (error) {
        // Don't log excessively, but handle the error by returning null
        // console.warn(`mathgene-worker: Error normalizing "${latex}":`, error.message);
        // Post back error state (which resolves to null on main thread)
        self.postMessage({ id, error: error.message }); // Error message helps debugging on main thread if needed
    }
};
