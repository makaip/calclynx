class EquivalenceUtils {
    static updateEquivalenceState() {
        if (window.expressionEquivalence) {
            window.expressionEquivalence.logEquivalentExpressions();
            window.expressionEquivalence.applyIndicatorColors();
        }
    }
}
