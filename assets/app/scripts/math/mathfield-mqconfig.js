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

export const mathQuillEditConfig = {
    handlers: {
        edit: (mq) => {
            self.latex = mq.latex();
        },
        enter: (mq) => {
            self.toStaticMode();

            const myPosition = self.getFieldPosition(self);
            self.parentGroup.insertField(myPosition + 1, '', true); // true = isNewField
        },
        upOutOf: (mq) => {
            const fieldAbove = self.getFieldAbove(self);
            if (fieldAbove) {
                fieldAbove.switchToEditMode();
                // TODO: manage cursor position
            }
        },
        downOutOf: (mq) => {
            const fieldBelow = self.getFieldBelow(self);
            if (fieldBelow) {
                fieldBelow.switchToEditMode();
                // TODO: manage cursor position
            }
        },
        deleteOutOf: (mq, dir) => {
            if (dir === 'left') {
                const fieldAbove = self.getFieldAbove(self);
                self.parentGroup.deleteField(self);

                if (fieldAbove) {
                    fieldAbove.switchToEditMode();
                    // TODO: move cursor to end of fieldAbove
                }

                self.destroy();
            }
        },
        blur: (mq) => {
            setTimeout(() => {
                if (!self.parentGroup.element.contains(document.activeElement)) {
                    self.toStaticMode();
                }
            }, 100);
        }
    }
}