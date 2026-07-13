const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', {
    openExternal: (url) => ipcRenderer.send('open-external', url),
    isElectron: true,
    toggleOverlay: (visible) => ipcRenderer.send('toggle-overlay', visible),
    updateOverlayParticipants: (data) => ipcRenderer.send('update-overlay-participants', data),
});
