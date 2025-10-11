import { userManager } from '../core/cloud.js';

export function initializeFileDownloadHandler() {
    // todo: push this to sidebar js
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

            if (!result || !result.success) throw new Error(result?.error || 'Failed to download file');
            if (!result.data) throw new Error("File not found or empty.");

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