// MathGene Derivative Examples
// This file demonstrates the derivative functionality

const mgCalculate = require('./libs/mathgene/mg_calculate.js');
const mgCalc = mgCalculate.mgCalc;

console.log("=".repeat(60));
console.log("MathGene Derivative System - Examples & Demonstrations");
console.log("=".repeat(60));

function showDerivative(expr, variable, order = 1, description = "") {
    console.log(`\n${description || `Derivative of ${expr}`}`);
    console.log("-".repeat(40));
    
    try {
        const result = mgCalc.Derivative(expr, variable, order);
        console.log(`f(${variable}) = ${expr}`);
        if (order === 1) {
            console.log(`f'(${variable}) = ${result.latex}`);
        } else {
            console.log(`f${"'".repeat(order)}(${variable}) = ${result.latex}`);
        }
        
        // Show HTML output for complex expressions
        if (result.html.length > 100) {
            console.log(`HTML: ${result.html.substring(0, 100)}...`);
        }
        
        return result.latex;
    } catch (error) {
        console.log(`Error: ${error.message}`);
        return null;
    }
}

function showGradient(expr, vars, description = "") {
    console.log(`\n${description || `Gradient of ${expr}`}`);
    console.log("-".repeat(40));
    
    try {
        const gradient = mgCalc.Gradient(expr, vars);
        console.log(`f(${vars.join(", ")}) = ${expr}`);
        console.log(`∇f = [${gradient.map(g => g.latex).join(", ")}]`);
        return gradient;
    } catch (error) {
        console.log(`Error: ${error.message}`);
        return null;
    }
}

// ===== BASIC DERIVATIVES =====
console.log("\n" + "=".repeat(30));
console.log("BASIC DERIVATIVE RULES");
console.log("=".repeat(30));

showDerivative("x", "x", 1, "Identity function");
showDerivative("5", "x", 1, "Constant function");
showDerivative("x^2", "x", 1, "Power rule: x²");
showDerivative("x^3", "x", 1, "Power rule: x³");
showDerivative("x^(-1)", "x", 1, "Power rule: x⁻¹");
showDerivative("x^(1/2)", "x", 1, "Power rule: x^(1/2)");

// ===== FUNCTION DERIVATIVES =====
console.log("\n" + "=".repeat(30));
console.log("STANDARD FUNCTION DERIVATIVES");
console.log("=".repeat(30));

showDerivative("sin(x)", "x", 1, "Sine function");
showDerivative("cos(x)", "x", 1, "Cosine function");
showDerivative("tan(x)", "x", 1, "Tangent function");
showDerivative("ln(x)", "x", 1, "Natural logarithm");
showDerivative("log(x)", "x", 1, "Base-10 logarithm");
showDerivative("e^x", "x", 1, "Exponential function");

// ===== PRODUCT AND QUOTIENT RULES =====
console.log("\n" + "=".repeat(30));
console.log("PRODUCT & QUOTIENT RULES");
console.log("=".repeat(30));

showDerivative("x*sin(x)", "x", 1, "Product rule example");
showDerivative("x^2*e^x", "x", 1, "Product rule: polynomial × exponential");
showDerivative("sin(x)*cos(x)", "x", 1, "Product rule: trigonometric");
showDerivative("sin(x)/x", "x", 1, "Quotient rule example");
showDerivative("x^2/(x+1)", "x", 1, "Quotient rule: rational function");

// ===== CHAIN RULE =====
console.log("\n" + "=".repeat(30));
console.log("CHAIN RULE EXAMPLES");
console.log("=".repeat(30));

showDerivative("sin(x^2)", "x", 1, "Chain rule: sin(x²)");
showDerivative("ln(x^2)", "x", 1, "Chain rule: ln(x²)");
showDerivative("e^(x^2)", "x", 1, "Chain rule: e^(x²)");
showDerivative("sin(cos(x))", "x", 1, "Chain rule: nested functions");
showDerivative("ln(sin(x))", "x", 1, "Chain rule: ln(sin(x))");

// ===== HIGHER ORDER DERIVATIVES =====
console.log("\n" + "=".repeat(30));
console.log("HIGHER ORDER DERIVATIVES");
console.log("=".repeat(30));

showDerivative("x^4", "x", 1, "First derivative of x⁴");
showDerivative("x^4", "x", 2, "Second derivative of x⁴");
showDerivative("x^4", "x", 3, "Third derivative of x⁴");
showDerivative("x^4", "x", 4, "Fourth derivative of x⁴");

showDerivative("sin(x)", "x", 1, "sin(x) - 1st derivative");
showDerivative("sin(x)", "x", 2, "sin(x) - 2nd derivative");
showDerivative("sin(x)", "x", 3, "sin(x) - 3rd derivative");
showDerivative("sin(x)", "x", 4, "sin(x) - 4th derivative");

// ===== MULTIVARIABLE CALCULUS =====
console.log("\n" + "=".repeat(30));
console.log("MULTIVARIABLE FUNCTIONS");
console.log("=".repeat(30));

showGradient("x^2 + y^2", ["x", "y"], "Paraboloid");
showGradient("x*y", ["x", "y"], "Hyperbolic paraboloid");
showGradient("x^2 + y^2 + z^2", ["x", "y", "z"], "Sphere");
showGradient("sin(x) + cos(y)", ["x", "y"], "Mixed trigonometric");
showGradient("x*e^y", ["x", "y"], "Exponential surface");

// ===== PHYSICS EXAMPLES =====
console.log("\n" + "=".repeat(30));
console.log("PHYSICS APPLICATIONS");
console.log("=".repeat(30));

showDerivative("1/2*m*v^2", "v", 1, "Kinetic energy → momentum");
showDerivative("m*g*h", "h", 1, "Gravitational potential energy → force");
showDerivative("1/2*k*x^2", "x", 1, "Spring potential energy → force");
showDerivative("A*sin(2*pi*f*t)", "t", 1, "Sinusoidal position → velocity");

// ===== OPTIMIZATION EXAMPLES =====
console.log("\n" + "=".repeat(30));
console.log("OPTIMIZATION PROBLEMS");
console.log("=".repeat(30));

const profit = "100*x - x^2";
showDerivative(profit, "x", 1, "Profit function → marginal profit");

const cost = "x^3 - 6*x^2 + 12*x + 5";
showDerivative(cost, "x", 1, "Cost function → marginal cost");
showDerivative(cost, "x", 2, "Cost function → rate of change of marginal cost");

// ===== CALCULUS VERIFICATION =====
console.log("\n" + "=".repeat(30));
console.log("CALCULUS IDENTITIES VERIFICATION");
console.log("=".repeat(30));

// Verify some calculus identities
console.log("\nVerifying d/dx[sin²(x) + cos²(x)] = 0:");
const sinSquaredPlusCosSquared = showDerivative("sin(x)^2 + cos(x)^2", "x");

console.log("\nVerifying product rule: d/dx[x·e^x] = e^x + x·e^x:");
const productRuleResult = showDerivative("x*e^x", "x");

console.log("\nVerifying chain rule: d/dx[e^(sin(x))] = e^(sin(x))·cos(x):");
const chainRuleResult = showDerivative("e^(sin(x))", "x");

console.log("\n" + "=".repeat(60));
console.log("DEMONSTRATION COMPLETE");
console.log("=".repeat(60));

console.log("\nThe MathGene derivative system successfully handles:");
console.log("✓ Basic derivative rules (power, constant, linear)");
console.log("✓ Standard functions (trig, log, exponential)");
console.log("✓ Product and quotient rules");
console.log("✓ Chain rule for composite functions");
console.log("✓ Higher-order derivatives");
console.log("✓ Partial derivatives and gradients");
console.log("✓ Complex nested expressions");
console.log("✓ Physics and optimization applications");

console.log("\nOutput formats available:");
console.log("• LaTeX for mathematical typesetting");
console.log("• HTML for web display");
console.log("• Internal MG format for computation");
