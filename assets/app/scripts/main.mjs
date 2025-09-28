import { ObjectGroup } from './core/objectgroup.js';
import { Navigation } from './core/navigation.js';
import { BoxSelection } from './core/selection.js';
import { Clipboard } from './core/clipboard.js';
import { supabaseClient } from './auth/initsupabaseapp.js';
import { User, userManager } from './core/cloud.js';
import { MathBoard } from './core/canvas.js';
import { App, updateUserStatus, initializeApp } from './core/main.js';

import { MathGroup } from './math/mathgroup.js';
import { TextGroup } from './text/textgroup.js';
import { ImageGroup } from './image/imagegroup.js';

import { MathField } from './math/mathfield.js';
import { MathFieldUtils } from './math/mathfield-utils.js';
import { MathFieldUIManager } from './math/mathfield-ui-manager.js';
import { MathFieldContainer } from './math/mathfield-container.js';
import { MathFieldEditor } from './math/mathfield-editor.js';
import { MathFieldEventHandler } from './math/mathfield-event-handler.js';
import { MathFieldStateManager } from './math/mathfield-state-manager.js';

import { TextFieldCompatibility } from './text/textfield-compatibility.js';
import { TextFieldProseMirror } from './text/textfield.js';
import { TextFieldProseMirrorSchema } from './text/textfield-schema.js';
import { TextFieldProseMirrorContent } from './text/textfield-content.js';
import { TextFieldProseMirrorEventHandler } from './text/textfield-event-handler.js';
import { MathNodeView } from './text/textfield-math-nodeview.js';

import { ImageGroupResizeHandler } from './image/imagegroup-resize-handler.js';

import { FileManager } from './file/filemanager.js';
import { FileReader } from './file/filereader.js';
import { FileWriter } from './file/filewriter.js';

import { EquivalenceUtils } from './utils/equivalence-utils.js';
import { ExpressionEquivalence } from './utils/equivalence.js';

import { BaseModal } from './modals/base-modal.js';
import { ContextMenu } from './ui/contextmenu.js';

import { SidebarUtils } from './sidebar/sidebar.js';
import { 
    sanitizeFileName,
    showError,
    hideError, 
    showModal,
    hideModal,
    setButtonLoading,
    initializeFileDownloadHandler as sidebarFileDownloadHandler
} from './sidebar/sidebar-file-actions.js';
import { 
    initializeSettingsHandler,
    initializeCreateBlankFileModal,
    initializeDeleteFileModal,
    initializeImageUrlModal,
    initializeRenameFileModal,
    initializeFileDownloadHandler,
    initializeCreateFromJsonModal,
    initializeEventDelegation
} from './sidebar/sidebar-ui-interactions.js';

import { TextFormatToolbar } from './ui/toolbar.js';
import { CommandPalette } from './ui/command-palette.js';
import { SettingsModalHandlers } from './ui/settings-modal.js';

const moduleExports = {
  ObjectGroup,
  MathBoard,
  Navigation,
  BoxSelection,
  Clipboard,
  supabaseClient,
  User,
  userManager,
  App,
  updateUserStatus,
  initializeApp,
  
  MathGroup,
  TextGroup,
  ImageGroup,
  
  MathField,
  MathFieldUtils,
  MathFieldUIManager,
  MathFieldContainer,
  MathFieldEditor,
  MathFieldEventHandler,
  MathFieldStateManager,
  
  TextFieldCompatibility,
  TextFieldProseMirror,
  TextFieldProseMirrorSchema,
  TextFieldProseMirrorContent,
  TextFieldProseMirrorEventHandler,
  MathNodeView,
  
  ImageGroupResizeHandler,
  
  FileManager,
  FileWriter,
  
  EquivalenceUtils,
  ExpressionEquivalence,
  
  BaseModal,
  ContextMenu,
  
  SidebarUtils,
  sanitizeFileName,
  showError,
  hideError,
  showModal,
  hideModal,
  setButtonLoading,
  sidebarFileDownloadHandler,
  initializeSettingsHandler,
  initializeCreateBlankFileModal,
  initializeDeleteFileModal,
  initializeImageUrlModal,
  initializeRenameFileModal,
  initializeFileDownloadHandler,
  initializeCreateFromJsonModal,
  initializeEventDelegation,
  
  TextFormatToolbar,
  CommandPalette,
  SettingsModalHandlers
};

// exports to window for backward compatability
Object.assign(window, moduleExports);

console.log('main.mjs loaded, all modules exported to window');

export default moduleExports;