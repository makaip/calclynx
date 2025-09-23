function sanitizeFileName(fileName) {
    if (!fileName || typeof fileName !== 'string') {
        return 'untitled';
    }

    return fileName.trim()
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_+|_+$/g, '') || 'untitled';
}

function ensureJsonExt(fileName) {
    if (!fileName || typeof fileName !== 'string') {
        return 'untitled.json';
    }
    return fileName.endsWith('.json') ? fileName : `${fileName}.json`;
}

function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

function hideError(element) {
    if (element) element.style.display = 'none';
}

function showModal(modal) {
    if (modal) modal.style.display = 'block';
}

function hideModal(modal) {
    if (modal) modal.style.display = 'none';
}

function setButtonLoading(button, isLoading, loadingText, normalText) {
    if (!button) return;
    
    button.disabled = isLoading;
    if (isLoading) {
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
    } else {
        button.innerHTML = normalText;
    }
}

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

            if (!result || !result.success) {
                throw new Error(result?.error || 'Failed to download file');
            }

            if (!result.data) {
                throw new Error("File not found or empty.");
            }

            const blob = (result.data instanceof Blob)
                ? result.data
                : new Blob([typeof result.data === 'string' ? result.data : JSON.stringify(result.data)], { type: 'application/json' });
            
            const link = document.createElement('a');
            const url = window.URL.createObjectURL(blob);
            link.href = url;
            link.download = ensureJsonExt(sanitizeFileName(fileName));
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