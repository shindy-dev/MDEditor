const fs = require('fs')
const {electron, app, BrowserWindow, Menu, ipcMain, TouchBarColorPicker, BrowserView} = require('electron');
const {PythonShell} = require('python-shell')
const pie = require('puppeteer-in-electron')
const puppeteer = require('puppeteer-core');


let mainWindow;
const __srcpath = `${__dirname}/src`
const __pypath = `${__srcpath}/py`
const __jspath = `${__srcpath}/js`
const __htmlpath = `${__srcpath}/html`
const __csspath = `${__srcpath}/css`
const __platform = process.platform
// * platform *
// 'aix'
// 'darwin'
// 'freebsd'
// 'linux'
// 'openbsd'
// 'sunos'
// 'win32'

// TODO: ダークモード
// TODO: md入力
// TODO: プレビューウィンドウ
// TODO: DnD対応

PythonShell.defaultOptions = {
  mode: 'text',
  pythonPath: `${__dirname}/venv/bin/python`,
  pythonOptions: ['-u'],
  scriptPath: __pypath,
}

const init_pie = async () => {
  await pie.initialize(app);
};
init_pie();

// window-all-closed
app.on('window-all-closed', app.quit);
// アプリ起動後の処理
app.on('ready', createWindow);

// メインウィンドウを作成するための関数
function createWindow() {
  mainWindow = new BrowserWindow(
  {
    titleBarStyle: 'default', 
    title: "", 
    width: 800, 
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: `${__jspath}/preload.js`
    },
  });
  mainWindow.on('closed', () => { mainWindow = null; });

  mainWindow.loadURL(`file://${__dirname}/index.html`);
  createMenu();
  // 開発ツールを有効化
  // mainWindow.openDevTools();
}

function createMenu(){
  const items = [
    { 
      label: "file", 
      submenu: [
        {
          label: "export",
          submenu: [
            {
              label: "export image",
              submenu: [
                {
                  label: "export png",
                  click(menuItem, browserWindow, event){ exportFile(ext='png');}
                },
                { 
                  label: "export jpg",
                  click(menuItem, browserWindow, event){ exportFile(ext='jpg');}
                }
              ]
            },
            {
              label: "export pdf",
              click(){ exportFile(ext='pdf'); }
            }
          ]
        }
      ]
    },
    {
      label: "editor", 
      submenu: [
        {role: 'undo'},
        {role: 'redo'},
        {type: 'separator',},
        {role: 'cut'},
        {role: 'copy'},
        {role: 'paste'},
      ]
    },
    {
      label: 'view',
      submenu: [
        {
          label: 'theme',
          submenu: [
            {
              label: 'vs',
              click(){}
            },
            {
              label: 'vs-dark',
              click(){}
            }
          ]
        },
        { role: 'resetzoom',},
        { role: 'zoomin',},
        { role: 'zoomout',},
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(items));
}


const exportFile = async (ext='png') => {
  const browser = await pie.connect(app, puppeteer);
  const previewWindow = new BrowserWindow({show: false});
  await previewWindow.loadURL(`file://${__htmlpath}/preview.html`);
  const page = await pie.getPage(browser, previewWindow);
  await page.loadURL(`file://${__htmlpath}/preview.html`);
  if (ext === 'pdf'){
    await page.pdf({path: `preview.${ext}`, format: 'A4'});
  }else{
    await page.screenshot({path: `preview.${ext}`, fullPage: true});
  }
  await browser.close();
  await previewWindow.destroy();
  previewWindow.on('closed', () => { previewWindow = null; });
};

ipcMain.on('md2html/i', (event, arg) => {
  const options = { args: [__platform, `${__htmlpath}/preview.html`, `${__csspath}/preview.css`, arg.md] };
  PythonShell.run('md2html.py', options, (err, results) => {
      mainWindow.webContents.send('md2html/o', {html: results.join('\n')});
  });
});