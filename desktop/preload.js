const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', {
    openExternal: (url) => ipcRenderer.send('open-external', url),
    isElectron: true,
    toggleOverlay: (visible) => ipcRenderer.send('toggle-overlay', visible),
    updateOverlayParticipants: (participants) => ipcRenderer.send('update-overlay-participants', participants),
    onOverlayParticipantsUpdate: (callback) => {
        const listener = (event, participants) => callback(participants);
        ipcRenderer.on('overlay-participants-update', listener);
        return () => ipcRenderer.off('overlay-participants-update', listener);
    },
    enterMiniPlayer: () => ipcRenderer.send('enter-mini-player'),
    exitMiniPlayer: () => ipcRenderer.send('exit-mini-player'),
    onMiniPlayerChanged: (callback) => {
        const listener = (event, active) => callback(active);
        ipcRenderer.on('mini-player-changed', listener);
        return () => ipcRenderer.off('mini-player-changed', listener);
    }
});
