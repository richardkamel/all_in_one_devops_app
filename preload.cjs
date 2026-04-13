const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  pickFolder: () => ipcRenderer.invoke('pick-folder'),
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  loadData: () => ipcRenderer.invoke('load-data'),
  detectProject: (folder) => ipcRenderer.invoke('detect-project', folder),
  detectDevServer: (folder) => ipcRenderer.invoke('detect-dev-server', folder),
  getStartCommand: (sessionId, folder) => ipcRenderer.invoke('get-start-command', { sessionId, folder }),
  saveCommand: (sessionId, command) => ipcRenderer.invoke('save-command', { sessionId, command }),
  loadCommand: (sessionId) => ipcRenderer.invoke('load-command', sessionId),
  startServer: (sessionId, folder, command) => ipcRenderer.invoke('start-server', { sessionId, folder, command }),
  stopServer: (sessionId) => ipcRenderer.invoke('stop-server', { sessionId }),
  onServerLog: (cb) => ipcRenderer.on('server-log', (_e, data) => cb(data)),
  onServerStopped: (cb) => ipcRenderer.on('server-stopped', (_e, data) => cb(data)),
  removeServerListeners: () => {
    ipcRenderer.removeAllListeners('server-log')
    ipcRenderer.removeAllListeners('server-stopped')
  },
  sendRequest: (opts) => ipcRenderer.invoke('send-request', opts),
  saveRequests: (sessionId, requests) => ipcRenderer.invoke('save-requests', { sessionId, requests }),
  loadRequests: (sessionId) => ipcRenderer.invoke('load-requests', sessionId),
})
