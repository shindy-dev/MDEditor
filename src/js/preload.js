const { contextBridge, ipcRenderer} = require("electron");
contextBridge.exposeInMainWorld(
  "api", {
    send: (channel, data) => {//rendererからの送信用//
        ipcRenderer.send(channel, data);            
      },
    on: (channel, func) => { //rendererでの受信用, funcはコールバック関数//
        ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  }
);