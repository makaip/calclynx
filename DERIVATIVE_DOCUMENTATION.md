# MathGene Derivative Functions

## Overview

The MathGene library now includes comprehensive symbolic differentiation capabilities. The derivative system supports:

- Basic differentiation rules (power, product, quotient, chain)
- All standard functions (trigonometric, hyperbolic, logarithmic, exponential)
- Higher-order derivatives
- Partial derivatives
- Total derivatives
- Gradient calculations
- Directional derivatives

## API Functions

### 1. `mgCalc.Derivative(expression, variable, order?)`

Computes the derivative of an expression with respect to a variable.

**Parameters:**
- `expression` (string): Mathematical expression to differentiate
- `variable` (string): Variable to differentiate with respect to
- `order` (number, optional): Order of derivative (default: 1)

**Returns:** String representation of the derivative

**Examples:**
```javascript
mgCalc.Derivative("x^2", "x");           // Returns: "2*x"
mgCalc.Derivative("sin(x)", "x");        // Returns: "cos(x)"
mgCalc.Derivative("x^3", "x", 2);        // Returns: "6*x" (second derivative)
mgCalc.Derivative("e^x", "x");           // Returns: "e^x"
mgCalc.Derivative("ln(x)", "x");         // Returns: "1/x"
```

### 2. `mgCalc.PartialDerivative(expression, variable, order?)`

Computes the partial derivative (same as Derivative for single-variable functions).

**Parameters:**
- `expression` (string): Mathematical expression to differentiate
- `variable` (string): Variable to differentiate with respect to
- `order` (number, optional): Order of derivative (default: 1)

**Returns:** String representation of the partial derivative

**Examples:**
```javascript
mgCalc.PartialDerivative("x^2 + y^2", "x");     // Returns: "2*x"
mgCalc.PartialDerivative("x*y + sin(x)", "y");  // Returns: "x"
```

### 3. `mgCalc.TotalDerivative(expression, variable, order?)`

Computes the total derivative, considering all variables as functions of the specified variable.

**Parameters:**
- `expression` (string): Mathematical expression to differentiate
- `variable` (string): Independent variable
- `order` (number, optional): Order of derivative (default: 1)

**Returns:** String representation of the total derivative

### 4. `mgCalc.Gradient(expression, variables?)`

Computes the gradient vector of a multivariable function.

**Parameters:**
- `expression` (string): Mathematical expression
- `variables` (array|string, optional): List of variables. If omitted, auto-detects from expression

**Returns:** Array of partial derivatives

**Examples:**
```javascript
mgCalc.Gradient("x^2 + y^2", ["x", "y"]);           // Returns: ["2*x", "2*y"]
mgCalc.Gradient("x*y + sin(x)", ["x", "y"]);        // Returns: ["y + cos(x)", "x"]
mgCalc.Gradient("x^2 + y^2 + z^2", "x,y,z");        // Returns: ["2*x", "2*y", "2*z"]
```

### 5. `mgCalc.DirectionalDerivative(expression, variables, direction)`

Computes the directional derivative in a specified direction.

**Parameters:**
- `expression` (string): Mathematical expression
- `variables` (array|string): Variables in the expression
- `direction` (array): Direction vector

**Returns:** String representation of the directional derivative

**Examples:**
```javascript
mgCalc.DirectionalDerivative("x^2 + y^2", ["x", "y"], ["1", "1"]);  // Direction (1,1)
```

## Supported Functions

The derivative system supports all standard mathematical functions:

### Basic Operations
- Addition: `f + g` → `f' + g'`
- Subtraction: `f - g` → `f' - g'`
- Multiplication: `f * g` → `f' * g + f * g'` (Product Rule)
- Division: `f / g` → `(f' * g - f * g') / g²` (Quotient Rule)
- Power: `f^n` → `n * f^(n-1) * f'` (Power Rule)
- Composition: `f(g(x))` → `f'(g(x)) * g'(x)` (Chain Rule)

### Exponential and Logarithmic
- `e^x` → `e^x`
- `a^x` → `a^x * ln(a)`
- `x^a` → `a * x^(a-1)`
- `ln(x)` → `1/x`
- `log_a(x)` → `1/(x * ln(a))`

### Trigonometric Functions
- `sin(x)` → `cos(x)`
- `cos(x)` → `-sin(x)`
- `tan(x)` → `sec²(x)`
- `cot(x)` → `-csc²(x)`
- `sec(x)` → `sec(x) * tan(x)`
- `csc(x)` → `-csc(x) * cot(x)`

### Inverse Trigonometric Functions
- `arcsin(x)` → `1/√(1-x²)`
- `arccos(x)` → `-1/√(1-x²)`
- `arctan(x)` → `1/(1+x²)`
- `arccot(x)` → `-1/(1+x²)`
- `arcsec(x)` → `1/(|x|√(x²-1))`
- `arccsc(x)` → `-1/(|x|√(x²-1))`

### Hyperbolic Functions
- `sinh(x)` → `cosh(x)`
- `cosh(x)` → `sinh(x)`
- `tanh(x)` → `1 - tanh²(x)`
- `coth(x)` → `1 - coth²(x)`
- `sech(x)` → `-tanh(x) * sech(x)`
- `csch(x)` → `-coth(x) * csch(x)`

### Inverse Hyperbolic Functions
- `asinh(x)` → `1/√(x²+1)`
- `acosh(x)` → `1/√(x²-1)`
- `atanh(x)` → `1/(1-x²)`

### Special Functions
- `abs(x)` → `x/|x|` (for x ≠ 0)
- `√x` → `1/(2√x)`
- `∛x` → `1/(3∛(x²))`

## Implementation Details

The derivative engine uses:

1. **Expression Parsing**: Converts input expressions to internal function format
2. **Recursive Differentiation**: Applies differentiation rules recursively
3. **Pattern Matching**: Identifies function types and applies appropriate rules
4. **Automatic Simplification**: Simplifies results using algebraic rules
5. **Chain Rule**: Automatically applied for composite functions

### Chain Rule Implementation

The system automatically detects composite functions and applies the chain rule:

```javascript
mgCalc.Derivative("sin(x^2)", "x");     // Returns: "2*x*cos(x^2)"
mgCalc.Derivative("ln(sin(x))", "x");   // Returns: "cos(x)/sin(x)"
mgCalc.Derivative("e^(x^2)", "x");      // Returns: "2*x*e^(x^2)"
```

### Higher-Order Derivatives

Higher-order derivatives are computed by recursive application:

```javascript
mgCalc.Derivative("x^4", "x", 1);   // Returns: "4*x^3"
mgCalc.Derivative("x^4", "x", 2);   // Returns: "12*x^2"
mgCalc.Derivative("x^4", "x", 3);   // Returns: "24*x"
mgCalc.Derivative("x^4", "x", 4);   // Returns: "24"
```

## Error Handling

The system handles various error conditions:

- **Invalid expressions**: Returns error message
- **Undefined derivatives**: Returns "undefined" for non-differentiable functions
- **Missing variables**: Auto-detects variables when possible
- **Domain restrictions**: Respects function domains (Real vs Complex)

## Integration with Existing System

The derivative functions integrate seamlessly with the existing MathGene system:

- Use `mgCalc.Simplify()` to simplify derivative results
- Use `mgCalc.Substitute()` to evaluate derivatives at specific points
- Use `mgCalc.Solve()` to solve equations involving derivatives
- Use `mgCalc.Factor()` and `mgCalc.Expand()` to manipulate derivative expressions

## Performance Considerations

The derivative engine is optimized for:

- **Pattern Recognition**: Fast identification of standard forms
- **Symbolic Computation**: Efficient symbolic manipulation
- **Memory Usage**: Minimal memory footprint for large expressions
- **Recursive Depth**: Handles deeply nested compositions

## Examples and Use Cases

### Calculus Education
```javascript
// Demonstrate power rule
mgCalc.Derivative("x^n", "x");  // Returns: "n*x^(n-1)"

// Show product rule
mgCalc.Derivative("x*e^x", "x");  // Returns: "e^x + x*e^x"

// Chain rule examples
mgCalc.Derivative("sin(2*x)", "x");  // Returns: "2*cos(2*x)"
```

### Physics Applications
```javascript
// Velocity from position
mgCalc.Derivative("1/2*a*t^2 + v0*t + x0", "t");  // Returns: "a*t + v0"

// Acceleration from velocity
mgCalc.Derivative("a*t + v0", "t");  // Returns: "a"
```

### Optimization
```javascript
// Find critical points
const expr = "x^3 - 3*x^2 + 2";
const derivative = mgCalc.Derivative(expr, "x");
const criticalPoints = mgCalc.Solve(derivative + " = 0", "x");
```

### Multivariable Calculus
```javascript
// Find gradient for optimization
const f = "x^2 + y^2 - 2*x - 4*y + 5";
const grad = mgCalc.Gradient(f, ["x", "y"]);  // Returns: ["2*x - 2", "2*y - 4"]

// Find minimum by setting gradient to zero
mgCalc.Solve(grad[0] + " = 0", "x");  // x = 1
mgCalc.Solve(grad[1] + " = 0", "y");  // y = 2
```

## Testing

Use the provided test file `test_derivatives.html` to verify functionality:

1. Open the test file in a web browser
2. Check the console for test results
3. Verify all derivative calculations are correct
4. Test edge cases and error conditions

The test suite covers:
- Basic derivative rules
- Function-specific derivatives
- Higher-order derivatives
- Multivariable functions
- Error handling
