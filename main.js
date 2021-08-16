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

const COEFFICIENT = 24 * 60 * 60 * 1000; // 日数とミリ秒を変換する係数
const DATES_OFFSET = 70 * 365 + 17 + 1 + 1; // 「1900/1/0」～「1970/1/1」 (日数)
const MILLIS_DIFFERENCE = 9 * 60 * 60 * 1000; // UTCとJSTの時差 (ミリ秒)

function convertSn2Ut(serialNumber) { // シリアル値→UNIX時間(ミリ秒)
  return (serialNumber - DATES_OFFSET) * COEFFICIENT - MILLIS_DIFFERENCE;
}

function dateFromSn(serialNumber) { // シリアル値→Date→hh:mm:ss表記
  return new Date(convertSn2Ut(serialNumber)).toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo' });
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
    const serchStart = sheet1_json_all.filter((obj) => obj[sheet1A1] === 'ログ開始' || obj[sheet1A1] === 'ログ終了' || (/^\d{1,3}_.+/).test(obj[sheet1A1]));
    console.log(serchStart);
    console.log(dateFromSn(serchStart[2].__EMPTY_1));
    const excelInfo = [];
    for (let i = 0; i <= serchStart.length - 3; i += 3) {
      excelInfo.push({ name: serchStart[0 + i][sheet1A1], start: dateFromSn(serchStart[1 + i].__EMPTY_1), end: dateFromSn(serchStart[2 + i].__EMPTY_1) });
    }
    console.log(excelInfo);
    e.reply('excelInfo', excelInfo);
  })();
});

app.whenReady().then(createWindow);
