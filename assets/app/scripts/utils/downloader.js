import { cloudManager } from '../core/cloud.js';


export class FileDownloader {
	async downloadAsJson(fileId, fileName) {
		await cloudManager.downloadFileAsJson(fileId, fileName);
	}
}