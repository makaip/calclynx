function initializeCreateBlankFileModal() {
    const createBlankFileModal = document.getElementById('createBlankFileModal');
    const closeCreateBlankFileModalBtn = document.getElementById('closeCreateBlankFileModal');
    const cancelCreateBlankFileBtn = document.getElementById('cancelCreateBlankFileButton');
    const confirmCreateBlankFileBtn = document.getElementById('confirmCreateBlankFileButton');
    const newBlankFileNameInput = document.getElementById('newBlankFileNameInput');
    const createBlankFileErrorMsg = document.getElementById('createBlankFile-error-message');

    window.handleCreateBlankFile = async function() {
        const fileName = newBlankFileNameInput?.value.trim() || '';

        if (!fileName) {
            showError(createBlankFileErrorMsg, 'File name cannot be empty.');
            newBlankFileNameInput?.focus();
            return;
        }
        
        hideError(createBlankFileErrorMsg);

        try {
            setButtonLoading(confirmCreateBlankFileBtn, true, 'Creating...', 'Create File');

            const result = await userManager.createBlankFile(fileName);

            if (!result.success) {
                throw new Error(result.error);
            }

            console.log("Blank file created successfully:", fileName);
            hideModal(createBlankFileModal);
            window.location.href = `/app.html?fileId=${result.fileId}`;

        } catch (error) {
            console.error('Create blank file failed:', error);
            showError(createBlankFileErrorMsg, error.message || 'Failed to create blank file');
            newBlankFileNameInput?.focus();
        } finally {
            setButtonLoading(confirmCreateBlankFileBtn, false, 'Creating...', 'Create File');
        }
    };

    closeCreateBlankFileModalBtn?.addEventListener('click', () => {
        hideModal(createBlankFileModal);
    });

    cancelCreateBlankFileBtn?.addEventListener('click', () => {
        hideModal(createBlankFileModal);
    });

    confirmCreateBlankFileBtn?.addEventListener('click', () => {
        window.handleCreateBlankFile();
    });
}