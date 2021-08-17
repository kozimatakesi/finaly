const {
  BrowserWindow, app, ipcMain, Notification,
} = require('electron');
const path = require('path');
const xlsx = require('xlsx');

const xutil = xlsx.utils;

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
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

ipcMain.on('readDirFile', (_, dirPath) => {
  console.log(dirPath);
});

// Excelのシリアル値を変換するための変数及び関数
const COEFFICIENT = 24 * 60 * 60 * 1000; // 日数とミリ秒を変換する係数
const DATES_OFFSET = 70 * 365 + 17 + 1 + 1; // 「1900/1/0」～「1970/1/1」 (日数)
const MILLIS_DIFFERENCE = 9 * 60 * 60 * 1000; // UTCとJSTの時差 (ミリ秒)

// シリアル値→UNIX時間(ミリ秒)
const convertSn2Ut = (serialNumber) => (serialNumber - DATES_OFFSET) * COEFFICIENT - MILLIS_DIFFERENCE;
// シリアル値→Date→hh:mm:ss表記
const dateFromSn = (serialNumber) => new Date(convertSn2Ut(serialNumber)).toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo' });
const dateOnlySn = (serialNumber) => new Date(convertSn2Ut(serialNumber)).toLocaleDateString('ja-JP');

// Excelファイルの取り込み
ipcMain.on('readExcelFile', (e, dirPath) => {
  const allExcelInfo = {};
  const book = xlsx.readFile(dirPath);
  const sheetNameList = book.SheetNames;
  const sheet1 = book.Sheets[sheetNameList[0]];
  const sheet1A1 = sheet1.A1.v;
  const sheet1JsonAll = xutil.sheet_to_json(sheet1);

  // 特定のtitleがA列入っている行オブジェクトをsheet1JsonAllから取得する関数
  const getLineDataTitle = (title) => {
    const result = sheet1JsonAll.filter((obj) => obj[sheet1A1] === title);
    return result;
  };

  // console.log(sheet1JsonAll);

  // 時間情報の取得
  const timeInfo = [];
  const serchStart = sheet1JsonAll.filter((obj) => obj[sheet1A1] === 'ログ開始' || obj[sheet1A1] === 'ログ終了' || (/^\d{1,3}_.+/).test(obj[sheet1A1]));
  for (let i = 0; i <= serchStart.length - 3; i += 3) {
    timeInfo.push({
      name: serchStart[0 + i][sheet1A1],
      start: dateFromSn(serchStart[1 + i].__EMPTY_1),
      end: dateFromSn(serchStart[2 + i].__EMPTY_1),
    });
  }

  // 端末情報の取得
  const UEInfo = [];
  const careerInfo = Object.values(getLineDataTitle('キャリア')[0]);
  const UESerch = Object.values(getLineDataTitle('端末')[0]);
  const testInfo = Object.values(getLineDataTitle('試験内容')[0]);
  const bandLockInfo = Object.values(getLineDataTitle('BAND')[0]);
  for (let i = 1; i < UESerch.length; i++) {
    if (UESerch[i] !== 0) {
      UEInfo.push({
        number: i,
        carrer: careerInfo[i],
        model: UESerch[i],
        test: testInfo[i],
        bandLock: bandLockInfo[i] === '無し' ? 'Free' : `${bandLockInfo[i]}Lock`,
      });
    }
  }

  // スキャナ、エリア、内容、測定日情報の取得
  const areaInfo = getLineDataTitle('測定エリア');
  const meansInfo = getLineDataTitle('測定内容');
  const daysInfo = getLineDataTitle('測定日');
  const scannerInfo = Object.values(getLineDataTitle('スキャナ機種')[0]);
  scannerInfo.shift();

  // それぞれの情報をオブジェクトallExcelInfoに格納
  allExcelInfo.sb = Object.values(areaInfo[0])[1];
  allExcelInfo.area = Object.values(areaInfo[1])[1];
  allExcelInfo.means = Object.values(meansInfo[0])[1];
  allExcelInfo.date = dateOnlySn(Object.values(daysInfo[0])[1]);
  allExcelInfo.scanner = scannerInfo;
  allExcelInfo.ue = UEInfo;
  allExcelInfo.time = timeInfo;

  console.log(allExcelInfo);

  e.reply('excelInfo', allExcelInfo);
});

app.whenReady().then(createWindow);
