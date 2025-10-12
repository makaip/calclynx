import { userManager } from '../core/cloud.js';


export class FileDownloader {
    async downloadAsJson(fileId, fileName) {
        await userManager.downloadFileAsJson(fileId, fileName);
    }
}