// Debug test for derivative functionality
const mgTranslate = require('./libs/mathgene/mg_translate.js');
const mgCalculate = require('./libs/mathgene/mg_calculate.js');

const mgCalc = mgCalculate.mgCalc;

console.log("Debugging MathGene Integration");
console.log("==============================");

// Test if mgTrans is available
console.log("mgTrans available:", typeof mgTranslate.mgTrans);
console.log("mgCalc available:", typeof mgCalc);

// Test basic functions first
try {
    console.log("\nTesting basic Simplify function:");
    const simpleTest = mgCalc.Simplify("2*x + 3*x");
    console.log("Simplify result type:", typeof simpleTest);
    console.log("Simplify result:", simpleTest);
} catch (error) {
    console.log("Simplify error:", error.message);
}

// Test if we can access internal functions
try {
    console.log("\nTesting if mgTrans is properly set up:");
    console.log("mgTrans.texImport type:", typeof mgTranslate.mgTrans?.texImport);
    console.log("mgTrans.Output type:", typeof mgTranslate.mgTrans?.Output);
    console.log("mgTrans.mgExport type:", typeof mgTranslate.mgTrans?.mgExport);
} catch (error) {
    console.log("mgTrans access error:", error.message);
}

// Test internal derivative function directly
try {
    console.log("\nTesting internal derivative access:");
    // We need to access the internal functions differently
    console.log("Testing simple derivative...");
    
    // Try calling the derivative function with minimal processing
    const testResult = mgCalc.Derivative("x", "x");
    console.log("Basic derivative result:", testResult);
    console.log("Type:", typeof testResult);
    
} catch (error) {
    console.log("Internal derivative error:", error.message);
    console.log("Stack:", error.stack);
}
