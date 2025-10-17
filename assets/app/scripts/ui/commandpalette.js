import { commands, variablePatterns } from './commandpalette-config.js';
import { CommandPaletteExecutor } from './commandpalette-executor.js';

class CommandPalette {
	constructor(options = {}) {
		this.modalElement = null;
		this.bootstrapModal = null;
		this.inputElement = null;
		this.optionsElement = null;
		this.selectedIndex = -1;
		this.filteredResults = [];
		this.currentReferenceElement = null;
		this.lastFocusedMathField = null;
		this.variableInputMode = false;
		this.currentVariablePattern = null;

		this.commands = commands;
		this.variablePatterns = variablePatterns;
		this.executor = new CommandPaletteExecutor();

		this.initialize();
	}

	initialize() {
		this.getModalReferences();
		this.setupMathFieldTracking();
		this.setupEventHandlers();
	}

	getModalReferences() {
		this.modalElement = document.getElementById('commandPaletteModal');
		this.inputElement = this.modalElement.querySelector('.command-palette-input');
		this.optionsElement = this.modalElement.querySelector('.command-palette-options');

		this.bootstrapModal = new bootstrap.Modal(this.modalElement, {
			backdrop: true,
			keyboard: false
		});
	}

	setupMathFieldTracking() {
		this.modalElement.classList.add('command-palette-ready');
	}

	setupEventHandlers() {
		this.inputElement.addEventListener('input', () => this.renderOptions());
		this.inputElement.addEventListener('keydown', (e) => this.handleKeyDown(e));
		this.modalElement.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				e.stopPropagation();
				this.hide();
			}
		});
		this.modalElement.addEventListener('shown.bs.modal', () => {
			this.inputElement?.focus();
		});
	}

	handleKeyDown(e) {
		if (e.key === 'Escape') {
			e.preventDefault();
			this.hide();
			return;
		}

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			this.moveSelection(1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			this.moveSelection(-1);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			this.selectCurrent();
		}
	}

	moveSelection(direction) {
		if (this.filteredResults.length === 0) return;

		this.selectedIndex += direction;

		if (this.selectedIndex < 0) {
			this.selectedIndex = this.filteredResults.length - 1;
		} else if (this.selectedIndex >= this.filteredResults.length) {
			this.selectedIndex = 0;
		}

		this.updateSelectionVisual();
	}

	selectCurrent() {
		const typedInput = this.inputElement.value.trim();

		const patternMatch = this.matchesVariablePattern(typedInput);
		if (patternMatch && patternMatch.isComplete) {
			this.executor.executeVariableCommand(patternMatch.key, patternMatch.variable, null, this.currentReferenceElement);
			this.hide();
			return;
		}

		if (this.selectedIndex >= 0 && this.selectedIndex < this.filteredResults.length) {
			const result = this.filteredResults[this.selectedIndex];
			const executionResult = this.executor.executeCommand(result, this.currentReferenceElement);

			if (executionResult.action === 'enterVariableMode') {
				this.enterVariableInputMode({
					key: executionResult.variablePattern,
					pattern: this.variablePatterns[executionResult.variablePattern]
				});
			} else if (executionResult.action === 'hide') {
				this.hide();
			}
			return;
		}

		if (patternMatch && !patternMatch.isComplete) {
			this.enterVariableInputMode(patternMatch);
			return;
		}

		this.hide();
	}

	enterVariableInputMode(patternMatch) {
		this.variableInputMode = true;
		this.currentVariablePattern = patternMatch.key;

		const pattern = this.variablePatterns[patternMatch.key];
		if (pattern) {
			this.inputElement.value = pattern.prefix;
			this.inputElement.classList.add('variable-input-mode');
			this.inputElement.focus();
			this.inputElement.setSelectionRange(
				this.inputElement.value.length,
				this.inputElement.value.length
			);
		}
	}

	renderOptions() {
		const query = this.inputElement.value.toLowerCase();
		this.optionsElement.innerHTML = '';

		if (this.variableInputMode) {
			this.renderVariableInputMode(query);
			return;
		}

		this.filteredResults = this.searchCommands(query);
		this.selectedIndex = -1;

		this.filteredResults.forEach((result, index) => {
			const option = this.createOptionElement(result, index);
			this.optionsElement.appendChild(option);
		});

		if (this.filteredResults.length > 0) {
			this.selectedIndex = 0;
			this.updateSelectionVisual();
		}
	}

	renderVariableInputMode(query) {
		const pattern = this.variablePatterns[this.currentVariablePattern];
		if (!pattern) return;

		const variable = pattern.extractor(query);
		const isValid = variable && pattern.validator(variable);

		const option = document.createElement('button');
		option.type = 'button';
		option.className = 'list-group-item list-group-item-action variable-input-option';
		option.innerHTML = `
			<span class="variable-input-container">
				<span class="variable-prefix">${pattern.prefix}</span>
				<span class="variable-placeholder badge bg-primary ms-1" data-placeholder="${pattern.placeholder}">
					${variable || pattern.placeholder}
				</span>
			</span>
		`;

		if (isValid) {
			option.classList.add('active');
		}

		this.optionsElement.appendChild(option);
	}

	searchCommands(query, maxResults = 10) {
		if (!query.trim()) {
			return this.commands.slice(0, maxResults).map(command => ({
				command,
				match: { score: 1, type: 'label' },
				score: 1
			}));
		}

		const results = [];

		for (const command of this.commands) {
			const match = this.matchCommand(command, query);
			if (match) {
				results.push({
					command,
					match,
					score: match.score
				});
			}
		}

		return results
			.sort((a, b) => b.score - a.score)
			.slice(0, maxResults);
	}

	matchCommand(command, input) {
		const lowerInput = input.toLowerCase();
		const lowerLabel = command.label.toLowerCase();

		if (lowerLabel.includes(lowerInput)) {
			return { score: 1, type: 'label' };
		}

		if (command.requiresVariable) {
			const match = this.matchesVariablePattern(input);
			if (match && match.key === command.variablePattern) {
				return {
					score: 0.9,
					type: 'variable',
					variable: match.variable,
					isComplete: match.isComplete
				};
			}
		}

		return null;
	}

	matchesVariablePattern(input) {
		const lowerInput = input.toLowerCase();
		for (const [key, pattern] of Object.entries(this.variablePatterns)) {
			if (lowerInput.startsWith(key + ' ')) {
				return {
					key,
					pattern,
					variable: pattern.extractor(lowerInput),
					isComplete: this.isCompleteVariableInput(lowerInput, pattern)
				};
			}
		}
		return null;
	}

	isCompleteVariableInput(input, pattern) {
		const variable = pattern.extractor(input);
		return variable && pattern.validator(variable);
	}

	createOptionElement(result, index) {
		const { command, match } = result;

		const option = document.createElement('button');
		option.type = 'button';
		option.className = 'list-group-item list-group-item-action';
		option.dataset.index = index;

		if (match && match.type === 'variable' && match.variable) {
			const pattern = this.variablePatterns[command.variablePattern];
			option.innerHTML = pattern.prefix + match.variable;
			if (match.isComplete) {
				option.classList.add('complete-variable');
			}
		} else {
			option.innerHTML = command.label;
			if (command.requiresVariable) {
				option.innerHTML += ' <span class="variable-indicator text-secondary fst-italic small">[variable]</span>';
			}
		}

		option.addEventListener('click', () => {
			this.selectedIndex = index;
			this.selectCurrent();
		});

		return option;
	}

	updateSelectionVisual() {
		const options = this.optionsElement.querySelectorAll('.list-group-item');

		options.forEach((option, index) => {
			if (index === this.selectedIndex) {
				option.classList.add('active');
				option.scrollIntoView({ block: 'nearest' });
			} else {
				option.classList.remove('active');
			}
		});
	}

	show(referenceElement = null) {
		this.currentReferenceElement = referenceElement;
		this.inputElement.value = '';
		this.selectedIndex = -1;
		this.variableInputMode = false;
		this.currentVariablePattern = null;
		this.inputElement.classList.remove('variable-input-mode');
		this.renderOptions();
		this.bootstrapModal.show();
	}

	hide() {
		this.bootstrapModal.hide();
	}

	onHide() {
		this.currentReferenceElement = null;
		this.variableInputMode = false;
		this.currentVariablePattern = null;
		this.inputElement.classList.remove('variable-input-mode');
	}
}

document.addEventListener('DOMContentLoaded', function () {
	try {
		window.commandPalette = new CommandPalette();
	} catch (error) {
		console.error('Error initializing command palette:', error);
	}
});

export { CommandPalette };
