const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', {
    openExternal: (url) => ipcRenderer.send('open-external', url),
    isElectron: true,
    toggleOverlay: (visible) => ipcRenderer.send('toggle-overlay', visible),
    updateOverlayParticipants: (data) => ipcRenderer.send('update-overlay-participants', data),
    
    // Güvenli IPC Kanalları (React -> Electron Main)
    sendOverlayControl: (action) => ipcRenderer.send('overlay-control', action),
    sendVideoFrame: (payload) => ipcRenderer.send('overlay-video-frame', payload),
    
    // Dinleyiciler
    onOverlayControlAction: (callback) => {
        const listener = (event, action) => callback(action);
        ipcRenderer.on('overlay-control-action', listener);
        return () => ipcRenderer.off('overlay-control-action', listener);
    }
});
