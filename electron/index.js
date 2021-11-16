const path = require('path');
const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const ytdl = require("ytdl-core")
const ytsr = require('ytsr')
const DiscordRPC = require('discord-rpc');
const rpc = new DiscordRPC.Client({ transport: 'ipc' });
const clientId = '909010288425173023';
let win;
let connected;
let appIcon = null;

function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            webSecurity: false,
            nodeIntegration: true,
            preload: __dirname + '/preload.js'

        },
    });
    appIcon = new Tray(path.join(__dirname, 'src/assets/electron-icon.png'));

    var contextMenu = Menu.buildFromTemplate([{
            label: 'Show App',
            click: function() {
                win.show();
            }
        },
        {
            label: 'Quit',
            click: function() {
                app.isQuiting = true;
                app.quit();
            }
        }
    ]);

    appIcon.setToolTip('Meristeo');
    appIcon.setContextMenu(contextMenu);

    win.on('minimize', function(event) {
        event.preventDefault();
        win.hide();
    });

    win.on('close', function(event) {
        if (!app.isQuiting) {
            event.preventDefault();
            win.hide();
        }

        return false;
    });
    win.loadURL('http://localhost:3000')
        //win.loadFile('index.html')
    win.maximize()
    win.setMenuBarVisibility(false)
    app.setAsDefaultProtocolClient('meristeo')
}
app.on('ready', createWindow);


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.on('search', async(event, arg) => {
    const getFilter = await ytsr.getFilters(arg);
    const useFilter = getFilter.get('Type').get('Video');
    try {
        let result = await ytsr(useFilter.url, { pages: 1 });
        event.reply('results', result)
    } catch (e) {
        event.reply('results', result)
    }
})

ipcMain.on('playUrl', async(event, arg) => {
    playUrl = await ytdl.getInfo(arg);
    playUrl = ytdl.filterFormats(playUrl.formats, 'audioonly')
    event.reply('playUrl', playUrl[0].url)
})

const setActivity = (info) => {
    if (!connected) return;
    rpc.setActivity({
        details: info[0].title,
        state: `Remaining: ${info[1]}`,
        instance: false,
    });
}

ipcMain.on('rpc', async(event, arg) => {
    setActivity(arg)
})

ipcMain.on('pause', async(event, arg) => {
    if (!connected) return
    rpc.clearActivity()
})
ipcMain.on('rpcConnect', (event, args) => {
    rpc.login({ clientId }).catch(() => {
        console.log('Disconnected/Failed to Connect')
        event.reply('rpcFail')
        connected = false
    });
})
rpc.on('ready', () => {
    console.log('Connected')
    win.webContents.send('rpcSuccess', rpc.user)
    connected = true;
})

rpc.login({ clientId }).catch(() => {
    console.log('Disconnected/Failed to Connect')
    ipcMain.emit('rpcFail')
    connected = false
});