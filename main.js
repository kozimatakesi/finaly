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

function getIndex(value, arr, prop) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][prop] === value) {
      return i;
    }
  }
  return -1; // 値が存在しなかったとき
}

// Excelファイルの取り込み
ipcMain.on('readExcelFile', (e, dirPath) => {
  (async () => {
    const book = await xlsx.readFile(dirPath);
    const sheet_name_list = book.SheetNames;
    const sheet1 = book.Sheets[sheet_name_list[0]];
    const sheet1A1 = sheet1.A1.v;
    console.log(sheet1A1);
    const sheet1_json_all = xutil.sheet_to_json(sheet1);
    const index = getIndex('駅名', sheet1_json_all, sheet1A1);
    console.log(index);
    console.log(sheet1_json_all[index]);
    sheet1['!ref'] = 'A47:C100';
  })();
});

app.whenReady().then(createWindow);
