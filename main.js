const { app, BrowserWindow, globalShortcut, dialog, screen, ipcMain } = require('electron')
const path = require('path')
const { autoUpdater } = require('electron-updater')

let winControl = null;
let winHologram = null;

function createWindows() {
  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();
  const externalDisplay = displays.find((display) => {
    return display.bounds.x !== 0 || display.bounds.y !== 0
  });

  const commonProps = {
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'build/icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  };

  // 1. Control Window (Laptop)
  winControl = new BrowserWindow({
    ...commonProps,
    width: 1000,
    height: 700,
    x: primaryDisplay.bounds.x + 50,
    y: primaryDisplay.bounds.y + 50,
    title: "Delphora - Control Panel"
  });
  
  winControl.removeMenu();
  winControl.loadFile('src/index.html', { query: { mode: 'control' } });

  // 2. Hologram Window
  winHologram = new BrowserWindow({
    ...commonProps,
    width: 1000,
    height: 700,
    x: primaryDisplay.bounds.x + 100,
    y: primaryDisplay.bounds.y + 100,
    title: "Delphora - Hologram Projection",
    fullscreen: false // Người dùng tự kéo sang màn hình rời và ấn F11
  });
  
  winHologram.removeMenu();
  winHologram.loadFile('src/index.html', { query: { mode: 'hologram' } });

  // Phím tắt chung
  globalShortcut.register('F11', () => {
    const focusedWin = BrowserWindow.getFocusedWindow();
    if (focusedWin) focusedWin.setFullScreen(!focusedWin.isFullScreen());
  });
  
  globalShortcut.register('CommandOrControl+D', () => {
    const focusedWin = BrowserWindow.getFocusedWindow();
    if (focusedWin) focusedWin.webContents.toggleDevTools();
  });

  // ── IPC ROUTING (Bidirectional) ──
  ipcMain.on('sync-action', (event, data) => {
    if (winHologram && !winHologram.isDestroyed() && event.sender !== winHologram.webContents) {
        winHologram.webContents.send('sync-action', data);
    }
    if (winControl && !winControl.isDestroyed() && event.sender !== winControl.webContents) {
        winControl.webContents.send('sync-action', data);
    }
  });

  // ── AUTO-UPDATER LOGIC ──
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-downloaded', () => {
      dialog.showMessageBox({
          type: 'info',
          title: 'Cập nhật hoàn tất',
          message: 'Một phiên bản mới của Delphora đã được tải về. Ứng dụng sẽ tự động khởi động lại để cài đặt.',
          buttons: ['Khởi động lại ngay']
      }).then(() => {
          setImmediate(() => autoUpdater.quitAndInstall());
      });
  });
}

app.whenReady().then(() => {
  createWindows();
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})