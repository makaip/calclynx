// Simple Node.js test for derivative functionality
// Run with: node test_derivative_simple.js

// Import the MathGene libraries
const mgTranslate = require('./libs/mathgene/mg_translate.js');
const mgCalculate = require('./libs/mathgene/mg_calculate.js');

// Access the global objects
const mgCalc = mgCalculate.mgCalc;

console.log("Testing MathGene Derivative Functions");
console.log("=====================================");

function testDerivative(expression, variable, description) {
    try {
        console.log(`\n${description}`);
        console.log(`Expression: ${expression}`);
        console.log(`Variable: ${variable}`);
        
        const result = mgCalc.Derivative(expression, variable);
        console.log(`Derivative (LaTeX): ${result.latex}`);
        console.log(`Derivative (HTML): ${result.html}`);
        
        const simplified = mgCalc.Simplify(result.latex);
        console.log(`Simplified (LaTeX): ${simplified.latex}`);
        
        return { success: true, result: result.latex };
    } catch (error) {
        console.log(`ERROR: ${error.message}`);
        return { success: false, error: error.message };
    }
}

function testGradient(expression, variables, description) {
    try {
        console.log(`\n${description}`);
        console.log(`Expression: ${expression}`);
        console.log(`Variables: ${JSON.stringify(variables)}`);
        
        const result = mgCalc.Gradient(expression, variables);
        const latexResults = result.map(r => r.latex || r);
        console.log(`Gradient (LaTeX): [${latexResults.join(", ")}]`);
        
        return { success: true, result: latexResults };
    } catch (error) {
        console.log(`ERROR: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Test basic derivative rules
console.log("\n=== BASIC DERIVATIVE RULES ===");
testDerivative("x^2", "x", "Power Rule: x²");
testDerivative("x^3", "x", "Power Rule: x³");
testDerivative("2*x", "x", "Linear function");
testDerivative("5", "x", "Constant function");

// Test trigonometric functions
console.log("\n=== TRIGONOMETRIC FUNCTIONS ===");
testDerivative("sin(x)", "x", "sin(x)");
testDerivative("cos(x)", "x", "cos(x)");
testDerivative("tan(x)", "x", "tan(x)");

// Test exponential and logarithmic functions
console.log("\n=== EXPONENTIAL AND LOGARITHMIC ===");
testDerivative("e^x", "x", "e^x");
testDerivative("ln(x)", "x", "ln(x)");

// Test product and quotient rules
console.log("\n=== PRODUCT AND QUOTIENT RULES ===");
testDerivative("x*sin(x)", "x", "Product Rule: x*sin(x)");
testDerivative("sin(x)/x", "x", "Quotient Rule: sin(x)/x");

// Test chain rule
console.log("\n=== CHAIN RULE ===");
testDerivative("sin(x^2)", "x", "Chain Rule: sin(x²)");
testDerivative("ln(sin(x))", "x", "Chain Rule: ln(sin(x))");

// Test higher-order derivatives
console.log("\n=== HIGHER-ORDER DERIVATIVES ===");
try {
    console.log("\nSecond derivative of x⁴");
    const secondDeriv = mgCalc.Derivative("x^4", "x", 2);
    console.log(`Second derivative (LaTeX): ${secondDeriv.latex}`);
} catch (error) {
    console.log(`ERROR: ${error.message}`);
}

// Test multivariable functions
console.log("\n=== MULTIVARIABLE FUNCTIONS ===");
testGradient("x^2 + y^2", ["x", "y"], "Gradient of x² + y²");
testGradient("x*y + sin(x)", ["x", "y"], "Gradient of x*y + sin(x)");

console.log("\n=== TESTS COMPLETED ===");
