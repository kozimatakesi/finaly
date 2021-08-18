const {
  BrowserWindow, app, ipcMain, Notification,
} = require('electron');
const path = require('path');
const fs = require('fs').promises;
const xlsx = require('xlsx');
const makeDir = require('make-dir');

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
  // win.webContents.openDevTools();
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

// ドロップされたディレクトリのパスを管理するオブジェクト
const pathInfo = {};
const allExcelInfo = {};

// 対象ディレクトリ直下のファイルを配列に入れ返す関数
const getScannerList = async (dir) => {
  const scanners = await fs.readdir(dir);
  const result = scanners.filter((item) => item.match(/DS_Store/) == null);
  return result;
};

// 各々のディレクトリがドロップされたときにオブジェクトpathInfoにパスを格納する
ipcMain.on('readDirFile', (_, dirPath) => {
  (async () => {
    pathInfo[dirPath.index] = dirPath.path;
    pathInfo[`${dirPath.index}Dir`] = await getScannerList(dirPath.path);
    console.log(pathInfo);
  })();
});

// Excelのシリアル値を変換するための変数及び関数
const COEFFICIENT = 24 * 60 * 60 * 1000; // 日数とミリ秒を変換する係数
const DATES_OFFSET = 70 * 365 + 17 + 1 + 1; // 「1900/1/0」～「1970/1/1」 (日数)
const MILLIS_DIFFERENCE = 9 * 60 * 60 * 1000; // UTCとJSTの時差 (ミリ秒)
const convertSn2Ut = (serialNumber) => (serialNumber - DATES_OFFSET) * COEFFICIENT - MILLIS_DIFFERENCE;
const dateFromSn = (serialNumber) => new Date(convertSn2Ut(serialNumber)).toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo' });
const dateOnlySn = (serialNumber) => new Date(convertSn2Ut(serialNumber)).toLocaleDateString('ja-JP');

const changeDate = (date) => {
  const dateArray = date.split('/');
  for (let i = 1; i < 2; i++) {
    if (dateArray[i].length === 1) {
      dateArray[i] = `0${dateArray[i]}`;
    }
  }
  return dateArray.join('');
};

// Excelファイルの取り込み
ipcMain.on('readExcelFile', (e, dirPath) => {
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
        dirName: `${careerInfo[i]}_${testInfo[i]}_${bandLockInfo[i] === '無し' ? 'Free' : `${bandLockInfo[i]}Lock`}`,
      });
      pathInfo[`ue${i - 1}`] = '';
    }
  }

  // スキャナ、エリア、内容、測定日情報の取得
  const areaInfo = getLineDataTitle('測定エリア');
  const meansInfo = getLineDataTitle('測定内容');
  const daysInfo = getLineDataTitle('測定日');
  const scannerInfo = Object.values(getLineDataTitle('スキャナ機種')[0]);
  scannerInfo.shift();
  for (let i = 0; i < scannerInfo.length; i++) {
    pathInfo[`scanner${i}`] = '';
    pathInfo[`scanner${i}Dir`] = '';
  }

  // それぞれの情報をオブジェクトallExcelInfoに格納
  allExcelInfo.sb = Object.values(areaInfo[0])[1];
  allExcelInfo.area = Object.values(areaInfo[1])[1];
  allExcelInfo.means = Object.values(meansInfo[0])[1];
  allExcelInfo.date = dateOnlySn(Object.values(daysInfo[0])[1]);
  allExcelInfo.scanner = scannerInfo.map((item) => item.replace('(M8780A)NEC', ''));
  allExcelInfo.ue = UEInfo;
  allExcelInfo.time = timeInfo;

  console.log(pathInfo);
  console.log(allExcelInfo);

  e.reply('excelInfo', allExcelInfo);
});

ipcMain.on('makeDir', (_, filePath) => {
  (async () => {
    const date = changeDate(allExcelInfo.date);
    const sbname = allExcelInfo.sb.includes('SBM最適化_') ? allExcelInfo.sb.replace('M最適化_', '') : allExcelInfo.sb;
    const makeDirPath = path.dirname(filePath);
    const makeDirPathRoot = `${makeDirPath}/${date}_${sbname}_${allExcelInfo.area}`;
    const mainDir = await makeDir(makeDirPathRoot);
    console.log(mainDir);
    for (let i = 0; i < allExcelInfo.time.length; i++) {
      const subDir = `${mainDir}/${allExcelInfo.time[i].name}`;
      await makeDir(subDir);
      for (let j = 0; j < allExcelInfo.ue.length; j++) {
        await makeDir(`${subDir}/${allExcelInfo.ue[j].dirName}`);
      }
      for (let k = 0; k < allExcelInfo.scanner.length; k++) {
        await makeDir(`${subDir}/${allExcelInfo.scanner[k]}`);
        for (let l = 0; l < pathInfo[`scanner${k}Dir`].length; l++) {
          await makeDir(`${subDir}/${allExcelInfo.scanner[k]}/${pathInfo[`scanner${k}Dir`][l]}`);
        }
      }
    }
  })();
});

app.whenReady().then(createWindow);
