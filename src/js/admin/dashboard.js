import { checkAuth } from './auth.js';
import * as auth from './auth.js';
import * as data from './data.js';
import * as exportModule from './export.js';
import * as modals from './modals.js';
import { toggleAccessGuide, copyToClipboard } from './utils.js';

// ES modules don't leak declarations onto `window` the way classic scripts
// do, but this page's HTML still calls these functions via inline
// onclick/onsubmit/onchange attributes — so they're exported explicitly.
window.handleLogin = auth.handleLogin;
window.preventUndo = auth.preventUndo;
window.handleLogout = auth.handleLogout;
window.loadAllSubmissions = data.loadAllSubmissions;
window.switchTab = data.switchTab;
window.filterTable = data.filterTable;
window.deleteSelected = data.deleteSelected;
window.toggleSelectAll = data.toggleSelectAll;
window.toggleSelectRow = data.toggleSelectRow;
window.deleteSubmission = data.deleteSubmission;
window.toggleExportMenu = exportModule.toggleExportMenu;
window.exportData = exportModule.exportData;
window.openDetailModal = modals.openDetailModal;
window.closeModal = modals.closeModal;
window.openChangePasswordModal = modals.openChangePasswordModal;
window.closePasswordModal = modals.closePasswordModal;
window.handleChangePassword = modals.handleChangePassword;
window.toggleAccessGuide = toggleAccessGuide;
window.copyToClipboard = copyToClipboard;

document.addEventListener('DOMContentLoaded', checkAuth);
