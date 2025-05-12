// Helper function to execute the correct MathGene calculation based on command name
function executeMathGeneOperation(commandName, sourceMg) {
    // Check for both MathGene interfaces - mgCalc (as used in equivalence.js) or mgCalculate
    console.log(`Executing MathGene command via mgCalc: ${commandName}`);
    
    // Add special handling for "Solve for x" type commands
    if (commandName.toLowerCase().startsWith('solve for ')) {
        const variable = commandName.substring('solve for '.length).trim();
        if (variable && mgCalc.Solve) {
            return mgCalc.Solve(sourceMg, variable);
        }
        return mgCalc.Simplify(sourceMg); // Fallback
    }
    
    switch (commandName) {
        case 'Simplify':
            return mgCalc.Simplify(sourceMg);
        case 'Expand':
            return mgCalc.Expand(sourceMg);
        case 'Solve for':
            return mgCalc.Simplify(sourceMg); // Use Simplify for Evaluate
        case 'Factor':
            return mgCalc.Factor ? mgCalc.Factor(sourceMg) : mgCalc.Simplify(sourceMg);
        default:
            console.warn("Unknown MathGene command:", commandName);
            return sourceMg;
    }
}

// Helper function to check if LaTeX contains an equals sign
function containsEqualsSign(latexStr) {
    // Simple check for the equals sign in LaTeX (=)
    return latexStr.includes('=');
}

function applyMathGeneCommand(commandName, sourceLatex, targetMathFieldInstance) {
    console.log("applyMathGeneCommand called with command:", commandName);
    console.log("Command type check:", typeof commandName);
    console.log("Source LaTeX:", sourceLatex);
    console.log("Target MathField Instance:", targetMathFieldInstance);

    // Check for both MathGene interfaces - mgCalc or mgTrans/mgCalculate
    const hasMgCalc = typeof mgCalc !== 'undefined';
    const hasMgTransCalculate = typeof mgTrans !== 'undefined' && typeof mgCalculate !== 'undefined';
    
    if (!hasMgCalc && !hasMgTransCalculate) {
        console.error("No MathGene libraries found globally.");
        if (targetMathFieldInstance && targetMathFieldInstance.mathField) {
            targetMathFieldInstance.mathField.latex(`\\text{Error: MathGene not available}`);
        }
        return;
    }

    if (!sourceLatex || !targetMathFieldInstance || !targetMathFieldInstance.mathField) {
        console.error("Missing source LaTeX or target MathField instance.");
        if (targetMathFieldInstance && targetMathFieldInstance.mathField) {
            targetMathFieldInstance.mathField.latex(`\\text{Error: Invalid input}`);
        }
        return;
    }

    try {
        let sourceMg, resultMg, mathGeneResult;
        let processedSourceLatex = sourceLatex;
        
        // For "Solve for" commands, check if there's an equals sign
        if (typeof commandName === 'string' && commandName.toLowerCase().startsWith('solve for ')) {
            if (!containsEqualsSign(sourceLatex)) {
                // If no equals sign, assume expression = 0
                processedSourceLatex = sourceLatex + ' = 0';
                console.log("No equals sign in equation, assuming equals zero:", processedSourceLatex);
            }
        }
        
        // Use mgCalc if available (like in equivalence.js)
        if (hasMgCalc) {
            console.log("Using mgCalc approach");
            
            // When using mgCalc, we don't need to convert from LaTeX - it handles it directly
            // Handle "Solve for x" using mgCalc.Solve
            if (typeof commandName === 'string' && commandName.toLowerCase().startsWith('solve for ')) {
                const variable = commandName.substring('solve for '.length).trim();
                console.log("Extracted variable for Solve:", variable);
                console.log("mgCalc.Solve available:", !!mgCalc.Solve);
                
                resultMg = mgCalc.Solve ? mgCalc.Solve(processedSourceLatex, variable) : mgCalc.Simplify(processedSourceLatex);
                console.log("Solve result:", resultMg);
            } else {
                switch (commandName) {
                    case 'Simplify':
                        resultMg = mgCalc.Simplify(processedSourceLatex);
                        break;
                    case 'Expand':
                        resultMg = mgCalc.Expand(processedSourceLatex);
                        break;
                    case 'Solve for':
                        // Fallback if no variable specified
                        resultMg = mgCalc.Simplify(processedSourceLatex);
                        break;
                    case 'Factor':
                        resultMg = mgCalc.Factor ? mgCalc.Factor(processedSourceLatex) : mgCalc.Simplify(processedSourceLatex);
                        break;
                    default:
                        console.warn("Unknown MathGene command:", commandName);
                        resultMg = processedSourceLatex;
                }
            }
            
            // mgCalc returns an object with a latex property
            if (!resultMg || !resultMg.latex) {
                console.error("MathGene operation returned invalid result.");
                targetMathFieldInstance.mathField.latex(`\\text{Error: Invalid calculation result}`);
                return;
            }
            
            // Use the latex property directly
            const resultLatex = resultMg.latex;
            console.log("Result LaTeX:", resultLatex);
            targetMathFieldInstance.mathField.latex(resultLatex);
        }
        // Fall back to mgTrans/mgCalculate
        else if (hasMgTransCalculate) {
            sourceMg = mgTrans.texImport(processedSourceLatex);
            console.log("Source MG:", sourceMg);

            resultMg = executeMathGeneOperation(commandName, sourceMg);
            console.log("Result MG:", resultMg);

            if (resultMg === undefined || resultMg === null) {
                console.error("MathGene operation returned undefined or null.");
                targetMathFieldInstance.mathField.latex(`\\text{Error: Calculation failed}`);
                return;
            }

            mathGeneResult = mgTrans.Output(resultMg);

            if (!mathGeneResult || typeof mathGeneResult.latex === 'undefined') {
                console.error("mgTrans.Output did not return a valid result with a latex property.");
                const originalOutputAttempt = mgTrans.Output(sourceMg);
                const fallbackLatex = (originalOutputAttempt && originalOutputAttempt.latex) ? originalOutputAttempt.latex : processedSourceLatex;
                targetMathFieldInstance.mathField.latex(`\\text{Error: Output failed} \\; ${fallbackLatex}`);
                return;
            }

            const resultLatex = mathGeneResult.latex;
            console.log("Result LaTeX:", resultLatex);
            targetMathFieldInstance.mathField.latex(resultLatex);
        }
    } catch (error) {
        console.error("Error during MathGene processing:", error);
        const errorMessage = error.message || 'Processing failed';
        const escapedErrorMessage = errorMessage.replace(/\\/g, '\\textbackslash ').replace(/_/g, '\\_').replace(/\{/g, '\\{').replace(/\}/g, '\\}');
        targetMathFieldInstance.mathField.latex(`\\text{Error: ${escapedErrorMessage}}`);
    }
}

class CommandOption {
  constructor(label, action) {
    this.label = label;
    this.action = action || (() => {}); 
  }
}
