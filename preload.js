const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('api', {
  notificationApi: {
    sendNotification(message) {
      ipcRenderer.send('notify', message);
    },
  },
  batteryApi: {

  },
  filesApi: {
    readExcelFile(filePath) {
      ipcRenderer.send('readExcelFile', filePath);
    },
    readDirFile(dirPath) {
      ipcRenderer.send('readDirFile', dirPath);
    },

  },
  on: (channel, callback) => {
    ipcRenderer.on(channel, (event, arg) => callback(event, arg));
  },
});
