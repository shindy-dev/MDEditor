// * platform *
// 'aix'
// 'darwin'
// 'freebsd'
// 'linux'
// 'openbsd'
// 'sunos'
// 'win32'

// TODO: 画像 ![](){: style='height:100px;'}
// TODO: プレビューウィンドウ
// TODO: DnD対応


/** ライブラリのインポート ******************************************************/
const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const Encoding = require('encoding-japanese');
const fs = require('fs');
const Iconv = require('iconv').Iconv;
const path = require('path');
const { PythonShell } = require('python-shell');

/** 定数宣言(汎用パス関連) ******************************************************/
const __setpath = path.join(__dirname, 'settings');
console.log(__setpath)
const __srcpath = path.join(__dirname, 'src');
const __jspath = path.join(__srcpath, 'js');
const __platform = process.platform;

/** 自作ライブラリのインポート **************************************************/
const { JsonIo } = require(path.join(__jspath, 'jsonio.js'));
const { ExportFile } = require(path.join(__jspath, 'exportfile.js'));
const { exportHtml } = require(path.join(__jspath, 'wrapping.js'));

/** 定数宣言 *******************************************************************/
let mainWindow, menu;  // メイン画面、メニュー
const previewPath = path.join(__srcpath, 'html', 'preview.html');
const previewCssPath = path.join(__srcpath, 'css', 'preview.html');
const optionPath = path.join(__setpath, 'mdeditor.json');  // 設定ファイルパス
const defaultOptions = JsonIo.load(path.join(__setpath, 'default.json'));
const appOptions = getOptions(optionPath);  // 一般設定
const diagOptions = JsonIo.load(path.join(__setpath, 'dialog.json'));  // ダイアログオプション
const min = 10;  // アップデート確認間隔(分)


/** イベント関数(アプリ) ********************************************************/
// すべてのウィンドウが閉じたときの動作
app.on('window-all-closed', async () => {
  exportHtml(previewPath, previewCssPath, '')
  await JsonIo.save(appOptions, optionPath);  // 設定を保存
  app.quit();
});

// アプリが起動準備に入ったときの動作
app.on('ready', async () => {
  createMenu(); // メニュー作成
  mainWindow = new BrowserWindow(JsonIo.load(path.join(__setpath, 'mainWindow.json'), __dirname));
  await mainWindow.loadURL(`file://${__dirname}/index.html`);

  // エディタ: テーマ設定
  mainWindow.webContents.send('set-monaco-theme', { theme: appOptions.theme });
  // エディタ: フィールド設定
  mainWindow.webContents.send('set-monaco-value', loadMd(appOptions.file.path));
  //setInterval(() => autoUpdater.checkForUpdatesAndNotify(), 1000 * 60 * min);

  // python-shellのデフォルト設定を適用
  PythonShell.defaultOptions = JsonIo.load(path.join(__setpath, 'python-shell.json'), __dirname)[__platform];
});

/** イベント関数(レンダラー間) **************************************************/
// html要求レスポンス
ipcMain.on('md2html/i', (event, args) => {
  PythonShell.run('md2html.py', { args: [args.md] }, (err, results) => {
    const value = results.join('\n')
    const buf = Buffer.from(value, 'binary');
    const body = (__platform !== 'win32' || !value) ? value : new Iconv(Encoding.detect(buf), 'utf-8').convert(buf).toString()
    mainWindow.webContents.send('md2html/o', { html: body });
    // htmlを出力
    exportHtml(previewPath, previewCssPath, body)
  });
});

// マークダウン保存レスポンス
ipcMain.on('save-monaco-value', (event, args) => {
  fs.writeFileSync(appOptions.file.path, args.value);
  if (args.reload)
    mainWindow.webContents.send('set-monaco-value', loadMd(appOptions.file.path));
});

/** ユーザ定義関数 *************************************************************/
// マークダウンの保存（名前を付けて保存）
function saveMdAs() {
  const filePath = dialog.showSaveDialogSync(mainWindow, diagOptions.SaveMdAs);
  if (filePath) {
    appOptions.file.path = filePath;
    mainWindow.webContents.send('get-monaco-value', { reload: true });
  }
}
// マークダウンの読み込み
function loadMd(filepath) {
  const ret = { value: '', filename: 'Untitled' };
  if (!filepath) return ret;
  try {
    if (!fs.existsSync(filepath)) throw `not found ${filepath}`
    const buf = fs.readFileSync(filepath);
    const encoding = Encoding.detect(buf);
    appOptions.file = { path: filepath, encoding: (encoding) ? encoding : 'utf-8' }
    ret.value = new Iconv(encoding, 'utf-8').convert(buf).toString();
    ret.filename = path.parse(filepath).name;
  } catch (error) {
    console.log(error);
    appOptions.file = defaultOptions.file;
  } finally {
    return ret;
  }
}
// 設定オブジェクトの取得
function getOptions(optionPath) {
  if (!fs.existsSync(optionPath)) {
    JsonIo.save(defaultOptions, optionPath);
    return defaultOptions;
  }
  return JsonIo.load(optionPath);
}
// メニューの作成
function createMenu() {
  const items = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open',
          click: () => {
            const filePaths = dialog.showOpenDialogSync(mainWindow, diagOptions.Open);
            if (filePaths) mainWindow.webContents.send('set-monaco-value', loadMd(filePaths[0]));
          }
        },
        {
          label: 'Save', accelerator: 'CmdOrCtrl+S',
          click: () => {
            (!appOptions.file.path) ? saveMdAs() : mainWindow.webContents.send('get-monaco-value', { reload: false });
          }
        },
        {
          label: 'Save As...', accelerator: 'Shift+CmdOrCtrl+S',
          click: saveMdAs
        },
        {
          label: 'Export',
          submenu: [
            {
              label: 'Export Image',
              submenu: [
                {
                  label: 'Export png',
                  click: (menuItem, browserWindow, event) => {
                    const filePath = dialog.showSaveDialogSync(mainWindow, diagOptions.ExportPng);
                    if (filePath) ExportFile.exportImage(previewPath, filePath);
                  }
                },
                {
                  label: 'Export jpeg',
                  click: (menuItem, browserWindow, event) => {
                    const filePath = dialog.showSaveDialogSync(mainWindow, diagOptions.ExportJpg);
                    if (filePath) ExportFile.exportImage(previewPath, filePath);
                  }
                }
              ]
            },
            {
              label: 'Export PDF',
              click: () => {
                const filePath = dialog.showSaveDialogSync(mainWindow, diagOptions.ExportPdf);
                if (filePath) ExportFile.exportPdf(previewPath, filePath);
              }
            }
          ]
        }
      ]
    },
    {
      label: 'Editor',
      submenu: [
        {
          label: 'Undo', accelerator: 'CmdOrCtrl+Z',
          click: () => { mainWindow.webContents.send('undo'); }
        },
        {
          label: 'Redo', accelerator: 'CmdOrCtrl+Y',
          click: () => { mainWindow.webContents.send('redo'); }
        },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Theme',
          submenu: [
            {
              label: 'Light',
              click: () => {
                mainWindow.webContents.send('set-monaco-theme', { theme: 'vs' });
                appOptions.theme = 'vs';
              }
            },
            {
              label: 'Dark',
              click: () => {
                mainWindow.webContents.send('set-monaco-theme', { theme: 'vs-dark' });
                appOptions.theme = 'vs-dark';
              }
            }
          ]
        },
        { role: 'toggledevtools' }
      ]
    }
  ];
  menu = Menu.buildFromTemplate(items);
  Menu.setApplicationMenu(menu);
}

// autoUpdater.on('update-downloaded', ({ version, files, path, sha512, releaseName, releaseNotes, releaseDate }) => {
//   const detail = `${app.getName()} ${version} ${releaseDate}`

//   dialog.showMessageBox(
//     mainWindow, // new BrowserWindow
//     {
//       type: 'question',
//       buttons: ['再起動', 'あとで'],
//       defaultId: 0,
//       cancelId: 999,
//       message: '新しいバージョンをダウンロードしました。再起動しますか？',
//       detail
//     },
//     res => {
//       if (res === 0) {
//         autoUpdater.quitAndInstall();
//       }
//     }
//   );
// });