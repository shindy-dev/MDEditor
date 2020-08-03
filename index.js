// * platform *
// 'aix'
// 'darwin'
// 'freebsd'
// 'linux'
// 'openbsd'
// 'sunos'
// 'win32'

// TODO: 画像 ![](){: style="height:100px;"}
// TODO: ダイアログ
// TODO: プレビューウィンドウ
// TODO: DnD対応

const path = require('path')
const __settingspath = path.join(__dirname, 'settings');
const __srcpath = path.join(__dirname, 'src');
const __jspath = path.join(__srcpath, 'js');
const __htmlpath = path.join(__srcpath, 'html');
const __csspath = path.join(__srcpath, 'css');
const __platform = process.platform;

const fs = require('fs');
const {app, BrowserWindow, Menu, ipcMain, dialog, webContents} = require('electron');
const {PythonShell} = require('python-shell');
const {JsonCast} = require(path.join(__jspath, 'jsoncast.js'));
const {ExportFile} = require(path.join(__jspath, 'exportfile.js'));
const {Utf8Cast} = require(path.join(__jspath, 'utf8cast.js'));

// settings
PythonShell.defaultOptions = JsonCast.loadJson(path.join(__settingspath , 'python-shell.json'));

if (!fs.existsSync(path.join(__settingspath, 'MDEditor.json'))){
  JsonCast.exportJson({
    theme: "vs",
    lastpath: ""}
    , path.join(__settingspath, 'MDEditor.json'));
}
const appOptions = JsonCast.loadJson(path.join(__settingspath, 'MDEditor.json'))

// variables
let mainWindow, menu;
const utf8Cast = new Utf8Cast();

// app events
app.on('window-all-closed', async () => {
  await JsonCast.exportJson(appOptions, path.join(__settingspath, 'MDEditor.json'));
  app.quit();
});
app.on('ready', async () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__jspath, 'preload.js')
    }
  });
  await mainWindow.loadURL(`file://${__dirname}/index.html`);
  settings();
  createMenu();

  // 開発ツールを有効化
  mainWindow.openDevTools();
});

function createMenu(){
  const items = [
    { 
      label: "File", 
      submenu: [
        {
          label: "Open",
          click: openMd
        },
        {
          label: "Save",
          accelerator: 'CmdOrCtrl+S',
          click: saveMd
        },
        {
          label: "Save As ...",
          accelerator: 'Shift+CmdOrCtrl+S',
          click: saveMd_dialog
        },
        {
          label: "Export",
          submenu: [
            {
              label: "Export Image",
              submenu: [
                {
                  label: "Export png",
                  click: (menuItem, browserWindow, event)=>{ 
                    ExportFile.exportImage(`file://${__htmlpath}/preview.html`, './preview.png');
                  }
                },
                { 
                  label: "Export jpeg",
                  click: (menuItem, browserWindow, event)=>{ 
                    ExportFile.exportImage(`file://${__htmlpath}/preview.html`, './preview.jpg');
                  }
                }
              ]
            },
            {
              label: "Export PDF",
              click: ()=>{ 
                const filePath = dialog.showSaveDialogSync(
                  mainWindow,
                  {
                    properties: [],
                    filters: [
                      {
                        name: 'Document',
                        extensions: ['pdf']
                      }
                    ]
                  });
                if(filePath){
                  ExportFile.exportPdf(`file://${__htmlpath}/preview.html`, filePath); 
                }
              }
            }
          ]
        }
      ]
    },
    {
      label: "Editor", 
      submenu: [
        {
          label: 'Undo',
          click: ()=>{mainWindow.webContents.send('undo');}
        },
        {
          label: 'Redo',
          click: ()=>{mainWindow.webContents.send('redo');}
        },
        {type: 'separator'},
        {role: 'cut'},
        {role: 'copy'},
        {role: 'paste'},
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
              click: ()=>{
                mainWindow.webContents.send('set-monaco-theme', {theme: 'vs'});
                appOptions['theme'] = 'vs';
              }
            },
            {
              label: 'Dark',
              click: ()=>{
                mainWindow.webContents.send('set-monaco-theme', {theme: 'vs-dark'});
                appOptions['theme'] = 'vs-dark';
              }
            }
          ]
        }
      ]
    }
  ];
  menu = Menu.buildFromTemplate(items);
  Menu.setApplicationMenu(menu);
}

function openMd() {
  const filePaths = dialog.showOpenDialogSync(
    mainWindow,
    {
      properties: ['openFile'],
      filters: [
        {
          name: 'Document',
          extensions: ['md']
        }
      ]
    });
  if(filePaths)
    mainWindow.webContents.send('set-monaco-value', {
      value: loadFile(filePaths[0]),
      filename: appOptions['lastpath'].replace(/^.*[\\\/]/, '')
    });
}

function saveMd() {
  if (!appOptions['lastpath']) saveMd_dialog();
  else mainWindow.webContents.send('get-monaco-value');
}

function saveMd_dialog(){
  const filePath = dialog.showSaveDialogSync(
    mainWindow,
    {
      properties: [],
      filters: [
        {
          name: 'Document',
          extensions: ['md']
        }
      ]
    });
  if(filePath){
    appOptions['lastpath'] = filePath;
    saveMd();
  }
}


function loadFile(path){
  if (!fs.existsSync(path)) return "";
  const value = utf8Cast.encode(fs.readFileSync(path));
  appOptions['lastpath'] = path;
  return value;
}

function settings(){
  mainWindow.webContents.send('set-monaco-theme', {theme: appOptions['theme']});
  mainWindow.webContents.send('set-monaco-value', {
    value: loadFile(appOptions['lastpath']),
    filename: (appOptions['lastpath']) ? appOptions['lastpath'].replace(/^.*[\\\/]/, '') : 'Untitled'
  });
}


ipcMain.on('md2html/i', (event, args) => {
  const options = { args: [__platform, `${__htmlpath}/preview.html`, `${__csspath}/preview.css`, args.md] };
  PythonShell.run('md2html.py', options, (err, results) => {
      mainWindow.webContents.send('md2html/o', {html: results.join('\n')});
  });
});

ipcMain.on('get-monaco-value', (event, args) => {
  fs.writeFileSync(appOptions['lastpath'], utf8Cast.decode(args.value));
});