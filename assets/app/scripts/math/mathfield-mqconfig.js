export const MQ = window.MathQuill ? window.MathQuill.getInterface(2) : {
    MathField: () => ({
        latex: () => '',
        focus: () => { },
        el: () => {
            const div = document.createElement('div');
            div.remove = () => { };
            return div;
        }
    }),

    StaticMath: () => ({
        latex: () => { },
        el: () => {
            const div = document.createElement('div');
            div.remove = () => { };
            return div;
        }
    }),

    getInterface: () => { }
};

export const mathQuillConfig = {
    spaceBehavesLikeTab: false,
    leftRightIntoCmdGoes: 'up',
    restrictMismatchedBrackets: true,
    sumStartsWithNEquals: true,
    supSubsRequireOperand: true,
    charsThatBreakOutOfSupSub: '=<>',
    autoSubscriptNumerals: false,
    autoCommands: 'pi theta sqrt sum prod alpha beta gamma delta epsilon zeta eta mu nu xi rho sigma tau phi chi psi omega',
    autoOperatorNames: 'sin cos tan sec csc cot sinh cosh tanh log ln exp lim sup inf det gcd lcm min max',
    maxDepth: 10
};