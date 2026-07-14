const { app, BrowserWindow, Menu, protocol, net, ipcMain, shell } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

let mainWindow;
let overlayWindow = null;
let originalBounds = null;

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
  // Format: oxypace://auth/process?token=XXXX -> /auth/process?token=XXXX
  const routePath = urlStr.replace('oxypace://', '/');
  console.log('Routing deep link via window.location.hash to:', routePath);
  
  // Navigate via HashRouter inside the renderer process to prevent asset loading paths from breaking
  mainWindow.webContents.executeJavaScript(`
    window.location.hash = "${routePath}";
  `).catch(err => {
    console.error('Failed to redirect via hash routing:', err);
    // Fallback loadURL
    mainWindow.loadURL('app://r/index.html#' + routePath);
  });
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
  mainWindow.webContents.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36");

  // Set up screen sharing source picker for getDisplayMedia in Electron
  const { session, desktopCapturer } = require('electron');
  
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen', 'window'] }).then((sources) => {
      // Automatically select the primary screen/window for sharing
      if (sources.length > 0) {
        callback({ video: sources[0] });
      } else {
        callback(new Error('No screenshare sources found'));
      }
    });
  });

  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['http://*/*', 'https://*/*'] },
    (details, callback) => {
      const headers = details.requestHeaders;
      const urlLower = details.url.toLowerCase();

      // Force a modern standard Chrome user agent for all external web requests
      headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

      // 1. ALWAYS force Referer and Origin spoofing for YouTube to bypass embedding restrictions (Error 150 / 152-4)
      if ((urlLower.includes('youtube.com') || urlLower.includes('youtube-nocookie.com')) && 
          (details.resourceType === 'subFrame' || details.resourceType === 'mainFrame')) {
        headers['Referer'] = 'https://oxypace.com.tr/';
        headers['Origin'] = 'https://oxypace.com.tr';
      } 
      // 2. ALWAYS force spoofing for OK.ru and VK.com embeds
      else if (urlLower.includes('ok.ru')) {
        headers['Referer'] = 'https://ok.ru/';
        headers['Origin'] = 'https://ok.ru';
      } else if (urlLower.includes('vk.com') || urlLower.includes('vk.ru')) {
        headers['Referer'] = 'https://vk.com/';
        headers['Origin'] = 'https://vk.com';
      } else if (urlLower.includes('mail.ru')) {
        headers['Referer'] = 'https://mail.ru/';
        headers['Origin'] = 'https://mail.ru';
      } else if (urlLower.includes('mega.nz')) {
        headers['Referer'] = 'https://mega.nz/';
        headers['Origin'] = 'https://mega.nz';
      }
      // 3. Otherwise, only rewrite to oxypace if it originally came from the app scheme
      else {
        const referer = headers['Referer'] || headers['referer'] || '';
        if (referer.startsWith('app://') || referer.startsWith('file://')) {
          headers['Referer'] = 'https://oxypace.com.tr/';
          headers['Origin'] = 'https://oxypace.com.tr';
        }
      }

      callback({ requestHeaders: headers });
    }
  );

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

// IPC listener for always-on-top transparent game overlay
// Uses a standalone overlay.html — NO React, NO auth, NO router dependency.
let overlayInterval = null;


ipcMain.on('toggle-overlay', (event, visible) => {
  if (visible) {
    if (!overlayWindow) {
      const { screen } = require('electron');
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.workAreaSize;

      overlayWindow = new BrowserWindow({
        width: 320,
        height: 580, // Increased default height from 480 to 580 to fit vertical view
        minWidth: 200,
        minHeight: 200,
        x: width - 340,
        y: 60,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: true, // Core feature: user can drag edges to resize!
        movable: true,   // Core feature: user can drag to move!
        hasShadow: true,
        focusable: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, 'preload.js'), // Use preload script
          backgroundThrottling: false,
        }
      });

      overlayWindow.loadFile(path.join(__dirname, 'overlay.html'));
      overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1);

      overlayWindow.on('closed', () => {
        overlayWindow = null;
      });

      overlayWindow.webContents.on('did-finish-load', () => {
        if (overlayWindow && !overlayWindow.isDestroyed() && lastParticipantData) {
          overlayWindow.webContents.send('overlay-participants-update', lastParticipantData);
        }
      });
    } else {
      overlayWindow.showInactive();
    }
  } else {
    if (overlayWindow) {
      overlayWindow.close();
      overlayWindow = null;
    }
  }
});


// Relay control triggers from overlay.html back to mainWindow
ipcMain.on('overlay-control', (event, action) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('overlay-control-action', action);
  }
});

// Resize overlay window based on collapse/expand state to prevent mouse blockages
ipcMain.on('overlay-resize', (event, collapsed) => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    const { screen } = require('electron');
    const bounds = overlayWindow.getBounds();
    if (collapsed) {
      // Disable shadow dynamically to completely remove ghost border shadows in OS
      overlayWindow.setHasShadow(false);
      // Shrink window strictly to 52x52 circular button area (zero padding residue)
      overlayWindow.setSize(52, 52);
      overlayWindow.setPosition(bounds.x + bounds.width - 52, bounds.y);
    } else {
      // Restore shadow dynamically
      overlayWindow.setHasShadow(true);
      // Restore to full panel size (320x450 as base)
      overlayWindow.setSize(320, 450);
      overlayWindow.setPosition(bounds.x + bounds.width - 320, bounds.y);
    }
  }
});

// Dynamically resize height based on content to remove empty spacing
ipcMain.on('overlay-resize-custom', (event, height) => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    const bounds = overlayWindow.getBounds();
    overlayWindow.setSize(320, height);
  }
});

// Move window with screen boundary safety (prevents dragging off-screen)
ipcMain.on('overlay-move-window', (event, { x, y }) => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    const winBounds = overlayWindow.getBounds();

    // Bound X position inside screen
    let finalX = Math.max(10, Math.min(width - winBounds.width - 10, x));
    // Bound Y position inside screen
    let finalY = Math.max(10, Math.min(height - winBounds.height - 10, y));

    overlayWindow.setPosition(finalX, finalY);
  }
});

// Sync listener returning accurate screen boundaries
ipcMain.on('overlay-get-bounds', (event) => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    event.returnValue = overlayWindow.getBounds();
  } else {
    event.returnValue = { x: 0, y: 0, width: 0, height: 0 };
  }
});

// Bring main Oxypace window to front
ipcMain.on('overlay-focus-main', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});


// Relay video frames (thumbnails) to overlayWindow
ipcMain.on('overlay-video-frame', (event, payload) => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send('overlay-video-frame', payload);
  }
});

// Cache latest participant data so we can send it after the overlay window loads
let lastParticipantData = null;

ipcMain.on('update-overlay-participants', (event, data) => {
  lastParticipantData = data;
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send('overlay-participants-update', data);
  }
});

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
