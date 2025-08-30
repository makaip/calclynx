// Test specific ln(x) derivative issue
const mgCalculate = require('./libs/mathgene/mg_calculate.js');
const mgCalc = mgCalculate.mgCalc;

console.log("Testing ln(x) derivative issue:");

// Test ln function
try {
    const lnTest = mgCalc.Derivative("ln(x)", "x");
    console.log("ln(x) derivative result:");
    console.log("LaTeX:", lnTest.latex);
    console.log("HTML:", lnTest.html);
    console.log("MG:", lnTest.mg);
    
    // Test the expression directly
    console.log("\nTesting with direct function call:");
    const lneTest = mgCalc.Derivative("lne(x)", "x");
    console.log("lne(x) derivative result:");
    console.log("LaTeX:", lneTest.latex);
    
    // Test simplification
    console.log("\nTesting simplification of 1/x:");
    const oneOverX = mgCalc.Simplify("1/x");
    console.log("1/x simplified:");
    console.log("LaTeX:", oneOverX.latex);
    
} catch (error) {
    console.log("Error:", error.message);
}
