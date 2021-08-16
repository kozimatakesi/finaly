const {
  BrowserWindow, app, ipcMain, Notification,
} = require('electron');
const path = require('path');
const xlsx = require('xlsx');

const xutil = xlsx.utils;

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: 'white',
    webPreferences: {
      nodeIntegration: false,
      worldSafeExecuteJavaScript: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  // デベロッパーツールを表示させる、ビルド時は削除
  win.webContents.openDevTools();
  //
  win.loadFile('index.html');
}

if (isDev) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
  });
}

// お知らせの表示
ipcMain.on('notify', (_, message) => {
  new Notification({ title: 'Notifiation', body: message }).show();
});

// Excelファイルの取り込み
ipcMain.on('readExcelFile', (e, dirPath) => {
  const book = xlsx.readFile(dirPath);
  const sheet1 = book.Sheets['日誌2021'];
  const range = sheet1['!ref'];
  console.log(range);
});

app.whenReady().then(createWindow);
