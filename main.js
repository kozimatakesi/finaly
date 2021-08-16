const {
  BrowserWindow, app, ipcMain, Notification,
} = require('electron');
const path = require('path');
const xlsx = require('xlsx');

const xutil = xlsx.utils;

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 400,
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

// 特定のプロパティの値が入っているオブジェクトのindexを取得する関数
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
    const serchStart = sheet1_json_all.filter((obj) => obj[sheet1A1] === 'ログ開始' || obj[sheet1A1] === 'ログ終了' || (/^\d{1,3}.+/).test(obj[sheet1A1]));
    console.log(serchStart);
  })();
});

app.whenReady().then(createWindow);
