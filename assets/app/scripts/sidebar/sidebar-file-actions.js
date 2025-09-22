const ErrorHandler = {
    handleAsyncError(error, operation, errorElement = null, userMessage = null) {
        console.error(`${operation} failed:`, error);
        
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
            console.error(`${context}: Missing required elements:`, missingElements);
            return false;
        }
        return true;
    }
};

const ModalUtils = {
    showError(errorElement, message) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    },

    hideError(errorElement) {
        errorElement.style.display = 'none';
    },

    showModal(modal) {
        modal.style.display = 'block';
    },

    hideModal(modal) {
        modal.style.display = 'none';
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