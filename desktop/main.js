const { app, BrowserWindow, Menu, protocol, net, ipcMain, shell } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

let mainWindow;

// Register 'app' scheme as privileged so it behaves like standard https (needed for cookies, storage, fetch)
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, bypassCSP: true } }
]);

// Protocol client registration for custom deep link protocol (oxypace://)
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('oxypace', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('oxypace', process.execPath);
}

function handleDeepLink(urlStr) {
  if (!mainWindow) return;
  // Format: oxypace://auth/process?token=XXXX -> app://r/auth/process?token=XXXX
  const routePath = urlStr.replace('oxypace://', '/');
  console.log('Routing deep link to:', 'app://r' + routePath);
  mainWindow.loadURL('app://r' + routePath);
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    
    // Find deep link in commandLine (Windows)
    const urlStr = commandLine.find(arg => arg.startsWith('oxypace://'));
    if (urlStr) {
      handleDeepLink(urlStr);
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 900,
    minHeight: 650,
    icon: path.join(__dirname, '../client/public/logo.png'),
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false // Necessary for loading R2 images/videos correctly
    },
    backgroundColor: '#0a0a0a',
    title: 'Oxypace'
  });

  // Set standard Chrome User Agent to bypass YouTube's block (Error 153) on Electron user agents
  mainWindow.webContents.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL('app://r/index.html');
    Menu.setApplicationMenu(null);
  }

  // Intercept new window requests (Google Login, external links)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Handle deep link at launch
  const deepLinkUrl = process.argv.find(arg => arg.startsWith('oxypace://'));
  if (deepLinkUrl) {
    // Wait a brief moment for index page to load, then process deep link
    setTimeout(() => {
      handleDeepLink(deepLinkUrl);
    }, 1500);
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// IPC listener for opening links in external browser safely
ipcMain.on('open-external', (event, targetUrl) => {
  if (targetUrl.startsWith('http:') || targetUrl.startsWith('https:')) {
    shell.openExternal(targetUrl);
  }
});

app.on('ready', () => {
  // Register custom protocol handler for 'app://' scheme
  protocol.handle('app', (request) => {
    const requestUrl = request.url;
    let filePath = requestUrl.replace('app://r', '');
    if (filePath === '/' || filePath === '') {
      filePath = '/index.html';
    }
    
    // Strip query params and hashes for file retrieval
    filePath = filePath.split('?')[0].split('#')[0];
    
    const absolutePath = path.join(__dirname, 'client-dist', decodeURIComponent(filePath));
    
    if (fs.existsSync(absolutePath)) {
      return net.fetch(url.pathToFileURL(absolutePath).toString());
    } else {
      // Return index.html for virtual client routes so Router can resolve them
      const indexPath = path.join(__dirname, 'client-dist', 'index.html');
      return net.fetch(url.pathToFileURL(indexPath).toString());
    }
  });

  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
