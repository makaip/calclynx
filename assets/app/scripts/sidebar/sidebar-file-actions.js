const Logger = {
    prefix: '[SidebarFileActions]',
    
    info(message, ...args) {
        console.log(`${this.prefix} ${message}`, ...args);
    },
    
    warn(message, ...args) {
        console.warn(`${this.prefix} ${message}`, ...args);
    },
    
    error(message, ...args) {
        console.error(`${this.prefix} ${message}`, ...args);
    },
    
    debug(message, ...args) {
        if (window.DEBUG_MODE) {
            console.debug(`${this.prefix} ${message}`, ...args);
        }
    }
};


const ErrorHandler = {
    handleAsyncError(error, operation, errorElement = null, userMessage = null) {
        Logger.error(`${operation} failed:`, error);
        
        const displayMessage = userMessage || error.message || `Failed to ${operation.toLowerCase()}`;
        
        if (errorElement) {
            ModalUtils.showError(errorElement, displayMessage);
        } else {
            alert(`Error: ${displayMessage}`);
        }
    },

    validateElements(elements, context) {
        const missingElements = Object.entries(elements)
            .filter(([key, element]) => !element)
            .map(([key]) => key);

        if (missingElements.length > 0) {
            Logger.error(`${context}: Missing required elements:`, missingElements);
            return false;
        }
        return true;
    }
};

const ModalUtils = {
    showError(errorElement, message) {
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    },

    hideError(errorElement) {
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    },

    showModal(modal) {
        if (modal) {
            modal.style.display = 'block';
        }
    },

    hideModal(modal) {
        if (modal) {
            modal.style.display = 'none';
        }
    },

    setButtonLoading(button, isLoading, loadingText, normalText) {
        if (!button) return;
        
        button.disabled = isLoading;
        if (isLoading) {
            button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
        } else {
            button.innerHTML = normalText;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {

    console.log("sidebar-file-actions.js: DOMContentLoaded");

    initializeFileDownloadHandler();
    initializeRenameFileModal();
    initializeDeleteFileModal();
    initializeCreateBlankFileModal();
    initializeImageUrlModal();
    
    Logger.info("All modal handlers initialized successfully");
});


function initializeFileDownloadHandler() {
    window.handleDownloadFileClick = async function(fileId, fileName) {
        try {
            const userInfo = await userManager.getUserInfo();
            if (!userInfo.isLoggedIn) {
                console.error("User not logged in, cannot download file.");
                alert("You must be logged in to download files.");
                return;
            }

            const filePath = `${userInfo.id}/${fileId}.json`;
            const result = await userManager.downloadFile(filePath);

            if (!result.success) {
                throw new Error(result.error || 'Failed to download file');
            }

            if (!result.data) {
                throw new Error("File not found or empty.");
            }

            const link = document.createElement('a');
            const url = window.URL.createObjectURL(result.data);
            link.href = url;
            link.download = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Error downloading file:", error);
            alert(`Error downloading file: ${error.message}`);
        }
    };
}

function initializeRenameFileModal() {
    const renameFileModal = document.getElementById('renameFileModal');
    const closeRenameFileModalBtn = document.getElementById('closeRenameFileModal');
    const cancelRenameFileBtn = document.getElementById('cancelRenameFileButton');
    const confirmRenameFileBtn = document.getElementById('confirmRenameFileButton');
    const newFileNameInput = document.getElementById('newFileNameInput');
    const renameErrorMessage = document.getElementById('rename-error-message');
    let fileIdToRename = null;

    window.handleRenameFileClick = function(fileId, currentName) {
        fileIdToRename = fileId;
        if (newFileNameInput) {
            newFileNameInput.value = currentName;
            newFileNameInput.focus();
        }
        ModalUtils.hideError(renameErrorMessage);
        ModalUtils.showModal(renameFileModal);
    };

    if (closeRenameFileModalBtn) {
        closeRenameFileModalBtn.addEventListener('click', () => {
            ModalUtils.hideModal(renameFileModal);
        });
    }

    if (cancelRenameFileBtn) {
        cancelRenameFileBtn.addEventListener('click', () => {
            ModalUtils.hideModal(renameFileModal);
        });
    }

    if (confirmRenameFileBtn) {
        confirmRenameFileBtn.addEventListener('click', async () => {
            const newName = newFileNameInput ? newFileNameInput.value.trim() : '';
            
            if (!newName) {
                ModalUtils.showError(renameErrorMessage, 'File name cannot be empty.');
                return;
            }

            ModalUtils.hideError(renameErrorMessage);

            try {
                ModalUtils.setButtonLoading(confirmRenameFileBtn, true, 'Renaming...', 'Rename');
                
                const result = await userManager.renameFile(fileIdToRename, newName);
                
                if (!result.success) {
                    ModalUtils.showError(renameErrorMessage, result.error);
                    return;
                }
                
                ModalUtils.hideModal(renameFileModal);
                if (typeof window.loadUserFiles === 'function') {
                    window.loadUserFiles();
                }
                
                const urlParams = new URLSearchParams(window.location.search);
                const currentFileId = urlParams.get('fileId');
                if (currentFileId === fileIdToRename) {
                    await userManager.updateFileTitle(fileIdToRename);
                }
            } catch (error) {
                console.error('Error renaming file:', error);
                ModalUtils.showError(renameErrorMessage, error.message || 'Failed to rename file.');
            } finally {
                ModalUtils.setButtonLoading(confirmRenameFileBtn, false, 'Renaming...', 'Rename');
            }
        });
    }
}

function initializeDeleteFileModal() {
    const deleteSidebarFileModal = document.getElementById('deleteSidebarFileModal');
    const closeDeleteSidebarFileModalBtn = document.getElementById('closeDeleteSidebarFileModal');
    const cancelDeleteSidebarFileBtn = document.getElementById('cancelDeleteSidebarFileButton');
    const confirmDeleteSidebarFileBtn = document.getElementById('confirmDeleteSidebarFileButton');
    const fileNameToDeleteSidebarElement = document.getElementById('fileNameToDeleteSidebar');
    const doNotAskAgainDeleteFileCheckbox = document.getElementById('doNotAskAgainDeleteFile');
    const deleteSidebarFileErrorMessage = document.getElementById('delete-sidebar-file-error-message');
    let fileIdToDeleteFromSidebar = null;


    window.handleDeleteFileClick = function(fileId, fileName) {
        fileIdToDeleteFromSidebar = fileId;
        if (fileNameToDeleteSidebarElement) {
            fileNameToDeleteSidebarElement.textContent = fileName;
        }
        ModalUtils.hideError(deleteSidebarFileErrorMessage);
        if (doNotAskAgainDeleteFileCheckbox) {
            doNotAskAgainDeleteFileCheckbox.checked = false;
        }

        if (sessionStorage.getItem('doNotAskAgainDeleteFile') === 'true') {
            confirmActualFileDelete();
        } else {
            ModalUtils.showModal(deleteSidebarFileModal);
        }
    };

    async function confirmActualFileDelete() {
        if (!fileIdToDeleteFromSidebar) return;
        
        try {
            ModalUtils.setButtonLoading(confirmDeleteSidebarFileBtn, true, 'Deleting...', 'Delete File');
            
            const result = await userManager.deleteFileRecord(fileIdToDeleteFromSidebar);
            
            if (!result.success) {
                throw new Error(result.error);
            }
            
            ModalUtils.hideModal(deleteSidebarFileModal);
            if (typeof window.loadUserFiles === 'function') {
                window.loadUserFiles();
            }

            const urlParams = new URLSearchParams(window.location.search);
            const currentFileId = urlParams.get('fileId');
            if (currentFileId === fileIdToDeleteFromSidebar) {
                await userManager.updateFileTitle(null); // "Untitled"
                window.location.href = '/app.html';
            }

        } catch (error) {
            console.error('Error deleting file from sidebar:', error);
            ModalUtils.showError(deleteSidebarFileErrorMessage, error.message || 'Failed to delete file.');
        } finally {
            ModalUtils.setButtonLoading(confirmDeleteSidebarFileBtn, false, 'Deleting...', 'Delete File');
        }
    }

    if (closeDeleteSidebarFileModalBtn) {
        closeDeleteSidebarFileModalBtn.addEventListener('click', () => {
            ModalUtils.hideModal(deleteSidebarFileModal);
        });
    }

    if (cancelDeleteSidebarFileBtn) {
        cancelDeleteSidebarFileBtn.addEventListener('click', () => {
            ModalUtils.hideModal(deleteSidebarFileModal);
        });
    }

    if (confirmDeleteSidebarFileBtn) {
        confirmDeleteSidebarFileBtn.addEventListener('click', async () => {
            if (doNotAskAgainDeleteFileCheckbox && doNotAskAgainDeleteFileCheckbox.checked) {
                sessionStorage.setItem('doNotAskAgainDeleteFile', 'true');
            }
            await confirmActualFileDelete();
        });
    }
}


function initializeCreateBlankFileModal() {
    const createBlankFileModal = document.getElementById('createBlankFileModal');
    const closeCreateBlankFileModalBtn = document.getElementById('closeCreateBlankFileModal');
    const cancelCreateBlankFileBtn = document.getElementById('cancelCreateBlankFileButton');
    const confirmCreateBlankFileBtn = document.getElementById('confirmCreateBlankFileButton');
    const newBlankFileNameInput = document.getElementById('newBlankFileNameInput');
    const createBlankFileErrorMsg = document.getElementById('createBlankFile-error-message');

    console.log("sidebar-file-actions.js: confirmCreateBlankFileBtn element:", confirmCreateBlankFileBtn);

    window.handleCreateBlankFile = async function() {
        Logger.debug("handleCreateBlankFile invoked");

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

            Logger.info("Blank file created successfully:", fileName);
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
        console.log("sidebar-file-actions.js: Attaching click listener to confirmCreateBlankFileButton.");
        confirmCreateBlankFileBtn.addEventListener('click', () => {
            console.log("sidebar-file-actions.js: confirmCreateBlankFileButton clicked!");
            window.handleCreateBlankFile();
        });
    } else {
        console.error("sidebar-file-actions.js: confirmCreateBlankFileButton NOT FOUND in DOMContentLoaded. Listener not attached.");
    }
}


function initializeImageUrlModal() {
    const imageUrlModal = document.getElementById('imageUrlModal');
    const closeImageUrlModalBtn = document.getElementById('closeImageUrlModal');
    const cancelImageUrlBtn = document.getElementById('cancelImageUrlButton');
    const confirmImageUrlBtn = document.getElementById('confirmImageUrlButton');
    const imageUrlInput = document.getElementById('imageUrlInput');
    const imageUrlErrorMessage = document.getElementById('imageUrl-error-message');
    let imageUrlCallback = null;


    window.showImageUrlModal = function(callback) {
        imageUrlCallback = callback;
        if (imageUrlInput) {
            imageUrlInput.value = '';
            imageUrlInput.focus();
        }
        ModalUtils.hideError(imageUrlErrorMessage);
        ModalUtils.showModal(imageUrlModal);
    };

    function isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }

    if (closeImageUrlModalBtn) {
        closeImageUrlModalBtn.addEventListener('click', () => {
            ModalUtils.hideModal(imageUrlModal);
            imageUrlCallback = null;
        });
    }

    if (cancelImageUrlBtn) {
        cancelImageUrlBtn.addEventListener('click', () => {
            ModalUtils.hideModal(imageUrlModal);
            imageUrlCallback = null;
        });
    }

    if (confirmImageUrlBtn) {
        confirmImageUrlBtn.addEventListener('click', () => {
            const url = imageUrlInput.value.trim();
            
            if (!url) {
                ModalUtils.showError(imageUrlErrorMessage, 'Please enter a URL.');
                return;
            }
            
            if (!isValidUrl(url)) {
                ModalUtils.showError(imageUrlErrorMessage, 'Please enter a valid URL.');
                return;
            }

            if (imageUrlCallback) {
                imageUrlCallback(url);
            }
            ModalUtils.hideModal(imageUrlModal);
            imageUrlCallback = null;
        });
    }

    if (imageUrlInput) {
        imageUrlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (confirmImageUrlBtn) {
                    confirmImageUrlBtn.click();
                }
            }
        });
        
        imageUrlInput.addEventListener('paste', () => {
            setTimeout(() => {
                ModalUtils.hideError(imageUrlErrorMessage);
            }, 0);
        });
    }
}
