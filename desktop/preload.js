const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', {
    openExternal: (url) => ipcRenderer.send('open-external', url),
    isElectron: true,
    toggleOverlay: (visible) => ipcRenderer.send('toggle-overlay', visible),
    updateOverlayParticipants: (data) => ipcRenderer.send('update-overlay-participants', data),
    
    // Güvenli IPC Kanalları
    sendOverlayControl: (action) => ipcRenderer.send('overlay-control', action),
    sendVideoFrame: (payload) => ipcRenderer.send('overlay-video-frame', payload),
    resizeOverlay: (collapsed) => ipcRenderer.send('overlay-resize', collapsed),
    resizeOverlayCustom: (height) => ipcRenderer.send('overlay-resize-custom', height),
    moveOverlayWindow: (coords) => ipcRenderer.send('overlay-move-window', coords),


    
    // Güvenli Dinleyiciler (React ve Overlay için ortak)
    onOverlayControlAction: (callback) => {
        const listener = (event, action) => callback(action);
        ipcRenderer.on('overlay-control-action', listener);
        return () => ipcRenderer.off('overlay-control-action', listener);
    },
    onOverlayParticipantsUpdate: (callback) => {
        const listener = (event, data) => callback(data);
        ipcRenderer.on('overlay-participants-update', listener);
        return () => ipcRenderer.off('overlay-participants-update', listener);
    },
    onOverlayVideoFrame: (callback) => {
        const listener = (event, payload) => callback(payload);
        ipcRenderer.on('overlay-video-frame', listener);
        return () => ipcRenderer.off('overlay-video-frame', listener);
    }
});
