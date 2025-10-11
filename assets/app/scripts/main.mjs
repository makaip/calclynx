import './core/main.js';

import { CreateFileModal } from './modals/createmodal.js';
import { DeleteFileModal } from './modals/deletemodal.js';
import { RenameFileModal } from './modals/renamemodal.js';
import { ImageUrlModal } from './modals/imagemodal.js';
import { SettingsModal } from './modals/settingsmodal.js';

window.createFileModal = new CreateFileModal();
window.deleteFileModal = new DeleteFileModal();
window.renameFileModal = new RenameFileModal();
window.imageUrlModal = new ImageUrlModal();
window.settingsModal = new SettingsModal();
