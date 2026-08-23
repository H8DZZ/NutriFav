const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    login: (email, password) => ipcRenderer.invoke('login', { email, password }),
    logout: () => ipcRenderer.invoke('logout'),
    getUser: () => ipcRenderer.invoke('get-user'),
    onUserData: (callback) => {
        ipcRenderer.on('user-data', (event, data) => callback(data));
    }
});