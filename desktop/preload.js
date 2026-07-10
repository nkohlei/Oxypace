const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', {
    openExternal: (url) => ipcRenderer.send('open-external', url),
    isElectron: true
});
