import { variablePatterns, commands } from './commandpalette-config.js';

export class CommandPaletteExecutor {
	constructor() {
		this.variablePatterns = variablePatterns;
		this.commandsMap = this.buildCommandsMap();
	}

	buildCommandsMap() {
		const map = new Map();
		commands.forEach(cmd => {
			map.set(cmd.label.toLowerCase(), cmd);
			if (cmd.variablePattern) {
				map.set(cmd.variablePattern, cmd);
			}
		});
		return map;
	}

	executeCommand(result, currentReferenceElement) {
		const { command, match } = result;
		const matchVariable = match && match.variable;

		if (command.requiresVariable && !matchVariable) {
			return {
				action: 'enterVariableMode',
				variablePattern: command.variablePattern
			};
		}

		const context = this.buildExecutionContext(command, matchVariable, currentReferenceElement);

		if (command.requiresVariable && matchVariable) {
			this.executeVariableCommand(command.variablePattern, matchVariable, context);
		} else {
			this.executeStandardCommand(command, context);
		}

		return { action: 'hide' };
	}

	executeVariableCommand(patternKey, variable, context = null, currentReferenceElement = null) {
		if (!context) {
			context = this.buildExecutionContext(null, variable, currentReferenceElement);
		}

		const pattern = this.variablePatterns[patternKey];
		if (pattern) {
			const commandName = pattern.prefix + variable;
			if (context.targetMathField && context.sourceLatex) {
				this.applyMathGeneCommand(commandName, context.sourceLatex, context.targetMathField);
			}
		}
	}

	executeStandardCommand(command, context) {
		if (context.targetMathField && context.sourceLatex) {
			this.applyMathGeneCommand(command.label, context.sourceLatex, context.targetMathField);
		}
	}

	buildExecutionContext(command = null, variable = null, currentReferenceElement = null) {
		const mathFields = document.querySelectorAll('.math-field-container');
		let referenceContainer = currentReferenceElement?.closest('.math-field-container');

		if (!referenceContainer && mathFields.length > 0) {
			referenceContainer = mathFields[mathFields.length - 1];
		}

		const context = {
			command,
			variable,
			referenceContainer,
			targetMathField: null,
			sourceLatex: null
		};

		if (referenceContainer && referenceContainer.parentElement?.mathGroup) {
			const targetMathField = referenceContainer.parentElement.mathGroup.insertMathFieldAfter(referenceContainer);
			context.targetMathField = targetMathField;

			const sourceMathFieldInstance = referenceContainer.mathFieldInstance;
			if (sourceMathFieldInstance && sourceMathFieldInstance.editor.mathField) {
				context.sourceLatex = sourceMathFieldInstance.editor.mathField.latex();
			} else if (referenceContainer.dataset.latex) {
				context.sourceLatex = referenceContainer.dataset.latex;
			}
		}

		return context;
	}

	applyMathGeneCommand(commandName, sourceLatex, targetMathFieldInstance) {
		if (!this.validateInputs(sourceLatex, targetMathFieldInstance)) {
			return;
		}

		try {
			const processedLatex = this.preprocessLatex(commandName, sourceLatex);

			if (typeof mgCalc !== 'undefined') {
				this.processMgCalc(commandName, processedLatex, targetMathFieldInstance);
			} else if (typeof mgTrans !== 'undefined' && typeof mgCalculate !== 'undefined') {
				this.processMgTransFallback(processedLatex, targetMathFieldInstance);
			} else {
				this.setErrorMessage(targetMathFieldInstance, 'MathGene not available');
				console.error("No MathGene libraries found globally.");
			}
		} catch (error) {
			this.handleProcessingError(error, targetMathFieldInstance);
		}
	}

	validateInputs(sourceLatex, targetMathFieldInstance) {
		if (!sourceLatex || !targetMathFieldInstance || !targetMathFieldInstance.editor.getMathField()) {
			console.error("Missing source LaTeX or target MathField instance.");
			if (targetMathFieldInstance && targetMathFieldInstance.editor.getMathField()) {
				this.setErrorMessage(targetMathFieldInstance, 'Invalid input');
			}
			return false;
		}
		return true;
	}

	preprocessLatex(commandName, sourceLatex) {
		if (typeof commandName === 'string' && commandName.toLowerCase().startsWith('solve for ')) {
			if (!sourceLatex.includes('=')) {
				return sourceLatex + ' = 0';
			}
		}
		return sourceLatex;
	}

	processMgCalc(commandName, processedLatex, targetMathFieldInstance) {
		const resultMg = this.executeMgCalcOperation(commandName, processedLatex);

		if (!resultMg || !resultMg.latex) {
			console.error("MathGene operation returned invalid result.");
			this.setErrorMessage(targetMathFieldInstance, 'Invalid calculation result');
			return;
		}

		targetMathFieldInstance.editor.getMathField().latex(resultMg.latex);
	}

	executeMgCalcOperation(commandName, processedLatex) {
		if (typeof commandName !== 'string') {
			return mgCalc.Simplify(processedLatex);
		}

		const lowerCommand = commandName.toLowerCase();

		for (const [patternKey, pattern] of Object.entries(this.variablePatterns)) {
			if (lowerCommand.startsWith(pattern.prefix.toLowerCase())) {
				const variable = pattern.extractor(commandName);
				const command = this.commandsMap.get(patternKey);
				if (command && command.mgCalcMethod) {
					const method = mgCalc[command.mgCalcMethod];
					return method ? method(processedLatex, variable) : mgCalc.Simplify(processedLatex);
				}
			}
		}

		const command = this.commandsMap.get(lowerCommand);
		if (command && command.mgCalcMethod) {
			const method = mgCalc[command.mgCalcMethod];
			return method ? method(processedLatex) : mgCalc.Simplify(processedLatex);
		}

		return mgCalc.Simplify(processedLatex);
	}

	processMgTransFallback(processedLatex, targetMathFieldInstance) {
		const sourceMg = mgTrans.texImport(processedLatex);
		const resultMg = mgCalculate.Simplify(sourceMg);
		const mathGeneResult = mgTrans.Output(resultMg);

		if (mathGeneResult && mathGeneResult.latex) {
			targetMathFieldInstance.editor.getMathField().latex(mathGeneResult.latex);
		} else {
			this.setErrorMessage(targetMathFieldInstance, 'Processing failed');
		}
	}

	setErrorMessage(targetMathFieldInstance, message) {
		targetMathFieldInstance.editor.getMathField().latex(`\\text{Error: ${message}}`);
	}

	handleProcessingError(error, targetMathFieldInstance) {
		console.error("Error during MathGene processing:", error);
		const errorMessage = error.message || 'Processing failed';
		const escapedErrorMessage = errorMessage
			.replace(/\\/g, '\\textbackslash ')
			.replace(/_/g, '\\_')
			.replace(/\{/g, '\\{')
			.replace(/\}/g, '\\}');
		this.setErrorMessage(targetMathFieldInstance, escapedErrorMessage);
	}
}
