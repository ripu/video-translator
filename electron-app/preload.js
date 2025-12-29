const { contextBridge, ipcRenderer } = require('electron');
const confetti = require('canvas-confetti');

contextBridge.exposeInMainWorld('electron', {
    send: (channel, data) => {
        let validChannels = ['process-video'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    on: (channel, func) => {
        let validChannels = ['processed-video-success', 'processed-video-error', 'process-progress', 'process-status'];
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes `sender` 
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },
    openPath: (path) => ipcRenderer.send('open-path', path),
    showItem: (path) => ipcRenderer.send('show-item', path),
    confetti: (options) => confetti(options)
});
