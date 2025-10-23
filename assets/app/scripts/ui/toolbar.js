class TextFormatToolbar {
	constructor() {
		this.toolbar = document.getElementById('toolbar');
		this.isVisible = false;
		this.activeTextField = null;

		this.init();
	}

	init() {
		const formatButtons = this.toolbar.querySelectorAll('.format-btn');
		formatButtons.forEach(btn => {
			btn.addEventListener('click', (e) => {
				e.preventDefault();
				const format = btn.dataset.format;
				this.handleFormatAction(format);
			});
		});

		document.addEventListener('click', (e) => {
			if (!this.toolbar.contains(e.target) && !this.isTextFieldTarget(e.target)) {
				this.hide();
			}
		});
	}

	show(textField = null) {
		if (textField) {
			this.activeTextField = textField;
		}

		this.toolbar.style.display = 'flex';
		this.toolbar.classList.remove('hidden');
		this.isVisible = true;

		this.updateButtonStates();
	}

	hide() {
		this.toolbar.classList.add('hidden');
		this.isVisible = false;
		this.activeTextField = null;

		if (!this.isVisible) {
			this.toolbar.style.display = 'none';
		}
	}

	toggle(textField = null) {
		if (this.isVisible) {
			this.hide();
		} else {
			this.show(textField);
		}
	}

	handleFormatAction(format) {
		if (!this.activeTextField || !this.activeTextField.proseMirrorView) {
			console.warn('No active text field for formatting');
			return;
		}

		const view = this.activeTextField.proseMirrorView;

		switch (format) {
			case 'bold':
				this.toggleMarkFormat(view, 'strong');
				break;
			case 'italic':
				this.toggleMarkFormat(view, 'em');
				break;
			case 'underline':
				this.toggleMarkFormat(view, 'underline');
				break;
			case 'heading':
				this.toggleBlockType(view, 'heading', { level: 1 });
				break;
			case 'equation':
				this.insertMathField(view);
				break;
			case 'bullet-list':
				this.toggleList(view, 'bullet_list');
				break;
			case 'number-list':
				this.toggleList(view, 'ordered_list');
				break;
		}

		this.updateButtonStates();
	}

	toggleButtonState(format) {
		const button = this.toolbar.querySelector(`[data-format="${format}"]`);
		if (button) {
			button.classList.toggle('active');
		}
	}

	toggleMarkFormat(view, markType) {
		const { state, dispatch } = view;
		const { toggleMark } = window.ProseMirror;
		const markTypeObj = state.schema.marks[markType];

		if (markTypeObj) {
			const command = toggleMark(markTypeObj);
			command(state, dispatch);
			view.focus();

		} else {
			console.warn(`Mark type ${markType} not found in schema`);
		}
	}

	toggleBlockType(view, nodeType, attrs = {}) {
		const { state, dispatch } = view;
		const { setBlockType } = window.ProseMirror;
		const nodeTypeObj = state.schema.nodes[nodeType];

		if (nodeTypeObj) {
			const command = setBlockType(nodeTypeObj, attrs);
			const canApply = command(state);

			if (canApply) {
				command(state, dispatch);

			} else {
				const paragraphType = state.schema.nodes.paragraph;
				const paragraphCommand = setBlockType(paragraphType);
				paragraphCommand(state, dispatch);

			}
			view.focus();
		} else {
			console.warn(`${nodeType} not found in schema`);
		}
	}

	toggleList(view, listType) {
		const { state, dispatch } = view;
		const { wrapInList, liftListItem } = window.ProseMirror;
		const listTypeObj = state.schema.nodes[listType];
		const listItemType = state.schema.nodes.list_item;

		if (!listTypeObj || !listItemType) {
			console.warn(`List type ${listType} or list_item not found in schema`);
			return;
		}

		const wrapCommand = wrapInList(listTypeObj);
		if (wrapCommand(state)) {
			wrapCommand(state, dispatch);
		} else {
			const liftCommand = liftListItem(listItemType);
			if (liftCommand(state)) {
				liftCommand(state, dispatch);
			}
		}

		view.focus();
	}

	insertMathField(view) {
		const { state, dispatch } = view;
		const mathNode = state.schema.nodes.math;

		if (mathNode) {
			const tr = state.tr.replaceSelectionWith(mathNode.create({ latex: '' }));
			dispatch(tr);

			setTimeout(() => {
				const mathFields = view.dom.querySelectorAll('.mathquill');
				const lastMathField = mathFields[mathFields.length - 1];
				if (lastMathField && lastMathField.mathquillObject) {
					lastMathField.mathquillObject.focus();
				}
			}, 10);
		}
	}

	updateButtonStates() {
		if (!this.activeTextField || !this.activeTextField.proseMirrorView) {
			return;
		}

		const view = this.activeTextField.proseMirrorView;
		const { state } = view;
		const { from, to } = state.selection;

		this.toolbar.querySelectorAll('.format-btn').forEach(btn => {
			btn.classList.remove('active');
		});

		if (state.schema.marks.strong && state.doc.rangeHasMark(from, to, state.schema.marks.strong)) {
			this.setButtonActive('bold');
		}

		if (state.schema.marks.em && state.doc.rangeHasMark(from, to, state.schema.marks.em)) {
			this.setButtonActive('italic');
		}

		if (state.schema.marks.underline && state.doc.rangeHasMark(from, to, state.schema.marks.underline)) {
			this.setButtonActive('underline');
		}

		const { $from } = state.selection;
		const currentNode = $from.parent;

		if (currentNode.type === state.schema.nodes.heading) {
			this.setButtonActive('heading');
		}

		for (let d = $from.depth; d >= 0; d--) {
			const node = $from.node(d);
			if (node.type === state.schema.nodes.bullet_list) {
				this.setButtonActive('bullet-list');
				break;
			} else if (node.type === state.schema.nodes.ordered_list) {
				this.setButtonActive('number-list');
				break;
			}
		}
	}

	setButtonActive(format) {
		const button = this.toolbar.querySelector(`[data-format="${format}"]`);
		if (button) {
			button.classList.add('active');
		}
	}

	isTextFieldTarget(element) {
		return element.closest('.text-editor') ||
			element.closest('.text-field-container') ||
			element.classList.contains('ProseMirror') ||
			element.closest('.prosemirror-editor');
	}
}


let toolbarInstance = null;

function getToolbarInstance() {
	if (!toolbarInstance) {
		toolbarInstance = new TextFormatToolbar();
		window.textFormatToolbar = toolbarInstance;
	}
	return toolbarInstance;
}

document.addEventListener('DOMContentLoaded', () => {
	getToolbarInstance();
});

document.addEventListener('DOMContentLoaded', () => {
	getToolbarInstance();
});

window.TextFormatToolbar = TextFormatToolbar;

window.showTextToolbar = function () {
	const toolbar = getToolbarInstance();
	toolbar.show();
};

window.getTextFormatToolbar = getToolbarInstance;

export { TextFormatToolbar };