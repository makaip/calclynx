// Helper function (similar to the one in commandPalette.js)
function executeMathGeneOperation(commandName, sourceMg) {
    // Ensure mgCalculate is available globally
    if (typeof mgCalculate === 'undefined') {
        console.error("MathGene calculation library (mgCalculate) not found globally.");
        throw new Error("mgCalculate missing");
    }

    console.log(`Executing MathGene command: ${commandName}`);
    switch (commandName) {
        case 'Simplify':
            return mgCalculate.xReduce(sourceMg);
        case 'Expand':
            if (typeof mgCalculate.xprExpand !== 'function') {
                 console.error("mgCalculate.xprExpand function not found.");
                 throw new Error("Expand function missing");
            }
            return mgCalculate.xprExpand(sourceMg);
        case 'Evaluate':
             return mgCalculate.xReduce(sourceMg); // Assuming Evaluate uses xReduce
        case 'Factor':
            if (typeof mgCalculate.pFactor !== 'function') {
                 console.error("mgCalculate.pFactor function not found.");
                 throw new Error("Factor function missing");
            }
            return mgCalculate.pFactor(sourceMg);
        default:
            console.warn("Unknown MathGene command:", commandName);
            return sourceMg; // Return original if command is unknown
    }
}

export function applyMathGeneCommand(command, sourceMathfield, targetMathfield) {
  // Check if MathGene libraries are loaded globally
  if (typeof mgTrans === 'undefined' || typeof mgCalculate === 'undefined') {
      console.error("MathGene libraries (mgTrans or mgCalculate) not found globally.");
      // Optionally set an error state in the target field if possible
      if (targetMathfield && typeof targetMathfield.setValue === 'function') {
          targetMathfield.setValue(`\\text{Error: Libs missing}`);
      }
      return; // Stop execution
  }

  // Ensure source and target mathfields are valid and have expected methods
  if (!sourceMathfield || typeof sourceMathfield.getValue !== 'function' ||
      !targetMathfield || typeof targetMathfield.setValue !== 'function') {
      console.error("Invalid source or target mathfield provided.");
      return;
  }

  const sourceLatex = sourceMathfield.getValue();
  if (!sourceLatex || sourceLatex.trim() === '') {
      console.warn("Source mathfield is empty.");
      targetMathfield.setValue(''); // Clear target or set specific message
      return;
  }

  try {
    const sourceMg = mgTrans.texImport(sourceLatex); // Use global mgTrans
    console.log("Source MG:", sourceMg);

    // Execute the command using the helper function
    const resultMg = executeMathGeneOperation(command, sourceMg);
    console.log("Result MG:", resultMg);

    // Check if the result is valid before outputting
    if (resultMg === undefined || resultMg === null) {
         console.error("MathGene operation returned undefined or null.");
         targetMathfield.setValue(`\\text{Error: Calc failed}`);
         return;
    }

    const mathGeneResult = mgTrans.Output(resultMg); // Use global mgTrans

    // Check if Output returned a valid result with a latex property
    if (!mathGeneResult || typeof mathGeneResult.latex === 'undefined') {
         console.error("mgTrans.Output did not return a valid result object with a latex property.");
         const originalOutputAttempt = mgTrans.Output(sourceMg);
         const fallbackLatex = (originalOutputAttempt && originalOutputAttempt.latex) ? originalOutputAttempt.latex : sourceLatex;
         targetMathfield.setValue(`\\text{Error: Output failed} \\; ${fallbackLatex}`);
         return;
    }

    const resultLatex = mathGeneResult.latex;
    console.log("Result LaTeX:", resultLatex);
    targetMathfield.setValue(resultLatex);

  } catch (error) {
      console.error(`Error during MathGene processing for command "${command}":`, error);
      const errorMessage = error.message || 'Processing failed';
      const escapedErrorMessage = errorMessage.replace(/\\/g, '\\textbackslash ').replace(/_/g, '\\_').replace(/\{/g, '\\{').replace(/\}/g, '\\}');
      targetMathfield.setValue(`\\text{Error: ${escapedErrorMessage}}`);
  }
}