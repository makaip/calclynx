function initializeCreateBlankFileModal() {
    const createBlankFileModal = document.getElementById('createBlankFileModal');
    const closeCreateBlankFileModalBtn = document.getElementById('closeCreateBlankFileModal');
    const cancelCreateBlankFileBtn = document.getElementById('cancelCreateBlankFileButton');
    const confirmCreateBlankFileBtn = document.getElementById('confirmCreateBlankFileButton');
    const newBlankFileNameInput = document.getElementById('newBlankFileNameInput');
    const createBlankFileErrorMsg = document.getElementById('createBlankFile-error-message');

    window.handleCreateBlankFile = async function() {
        const elements = {
            nameInput: newBlankFileNameInput,
            errorMessage: createBlankFileErrorMsg,
            confirmButton: confirmCreateBlankFileBtn,
            modal: createBlankFileModal
        };

        if (!ErrorHandler.validateElements(elements, "Create blank file modal")) {
            return;
        }

        const fileName = elements.nameInput.value.trim();

        if (!fileName) {
            ErrorHandler.handleAsyncError(
                new Error('File name cannot be empty.'), 
                "Create blank file",
                elements.errorMessage
            );
            elements.nameInput.focus();
            return;
        }
        
        ModalUtils.hideError(elements.errorMessage);

        try {
            ModalUtils.setButtonLoading(elements.confirmButton, true, 'Creating...', 'Create File');

            const result = await userManager.createBlankFile(fileName);

            if (!result.success) {
                throw new Error(result.error);
            }

            console.log("Blank file created successfully:", fileName);
            ModalUtils.hideModal(elements.modal);
            window.location.href = `/app.html?fileId=${result.fileId}`;

        } catch (error) {
            ErrorHandler.handleAsyncError(error, "Create blank file", elements.errorMessage);
            elements.nameInput.focus();
        } finally {
            ModalUtils.setButtonLoading(elements.confirmButton, false, 'Creating...', 'Create File');
        }
    };

    if (closeCreateBlankFileModalBtn) {
        closeCreateBlankFileModalBtn.addEventListener('click', () => {
            ModalUtils.hideModal(createBlankFileModal);
        });
    }

    if (cancelCreateBlankFileBtn) {
        cancelCreateBlankFileBtn.addEventListener('click', () => {
            ModalUtils.hideModal(createBlankFileModal);
        });
    }

    if (confirmCreateBlankFileBtn) {
        confirmCreateBlankFileBtn.addEventListener('click', () => {
            window.handleCreateBlankFile();
        });
    }
}