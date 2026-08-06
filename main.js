const { app, BrowserWindow, globalShortcut, dialog, screen, ipcMain } = require('electron')
const path = require('path')
const { autoUpdater } = require('electron-updater')

let winMain = null;

function createWindows() {
  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();

  const commonProps = {
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'build/icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  };

  winMain = new BrowserWindow({
    ...commonProps,
    width: 1200,
    height: 800,
    x: primaryDisplay.bounds.x + 50,
    y: primaryDisplay.bounds.y + 50,
    title: "Delphora - Hologram Projection",
    fullscreen: false
  });
  
  winMain.removeMenu();
  winMain.loadFile('src/index.html');

  // Phím tắt chung
  globalShortcut.register('F11', () => {
    const focusedWin = BrowserWindow.getFocusedWindow();
    if (focusedWin) focusedWin.setFullScreen(!focusedWin.isFullScreen());
  });
  
  globalShortcut.register('CommandOrControl+D', () => {
    const focusedWin = BrowserWindow.getFocusedWindow();
    if (focusedWin) focusedWin.webContents.toggleDevTools();
  });

  // ── IPC ROUTING (Legacy - Removed for Single Window SPA) ──
  ipcMain.on('sync-action', (event, data) => {
    // No longer needed as we are using a Single Window SPA architecture.
    // The UI handles its own state updates without needing IPC syncing.
  });

  // 🔥 AUTO-UPDATER LOGIC (DISABLED FOR TRUE EDGE AI)
  // autoUpdater.checkForUpdatesAndNotify();
  
  /*
  autoUpdater.on('update-downloaded', () => {
      dialog.showMessageBox({
          type: 'info',
          title: 'Cập nhật sẵn sàng',
          message: 'Đã tải xong phiên bản mới. Ứng dụng sẽ khởi động lại để cài đặt.',
          buttons: ['Khởi động lại ngay']
      }).then(() => {
          setImmediate(() => autoUpdater.quitAndInstall());
      });
  });
  */
}

app.whenReady().then(() => {
  createWindows()

  // Setup OpenVINO handlers
  try {
    const { addon: ov } = require('openvino-node');
    const fs = require('fs');
    let ovCore = null;
    let compiledModel = null;
    let inferRequest = null;

    ipcMain.handle('ov-init', async (event, weightsArrayBuffer) => {
      try {
        console.log("[Main] ov-init called, writing weights to bin file...");
        const uniqueSuffix = Date.now();
        const userDataPath = app.getPath('userData');
        const binPath = path.join(userDataPath, `gesture_mlp_temp_${uniqueSuffix}.bin`);
        const xmlPath = path.join(userDataPath, `gesture_mlp_temp_${uniqueSuffix}.xml`);
        const originalXmlPath = path.join(__dirname, 'src', 'vendor', 'gesture_mlp_base.xml');
        
        fs.copyFileSync(originalXmlPath, xmlPath);
        fs.writeFileSync(binPath, Buffer.from(weightsArrayBuffer));
        
        if (!ovCore) ovCore = new ov.Core();
        
        // Pass xmlPath (string) directly to compileModel to avoid signature mismatch
        compiledModel = await ovCore.compileModel(xmlPath, 'AUTO');
        inferRequest = compiledModel.createInferRequest();
        
        console.log("[Main] OpenVINO model compiled successfully.");
        return 'success';
      } catch (err) {
        console.error("Lỗi khi ghi đè weights:", err);
        return 'error';
      }
    });

    // AUTO-LOGGING CHO BENCHMARK
    ipcMain.on('log-benchmark', (event, data) => {
      const logLine = `[${new Date().toISOString()}] Engine: ${data.engine} | Net: ${data.network} | T: ${data.time}s | FPS: ${data.fps} | Latency: ${data.latency}ms | RAM: ${data.ram}MB\n`;
      fs.appendFileSync(path.join(__dirname, 'benchmark_logs.txt'), logLine);
    });

    ipcMain.on('log-stresstest', (event, data) => {
      const logLine = `[${new Date().toISOString()}] STRESS TEST LẦN ${data.iteration}: ${data.accuracy}%\n`;
      fs.appendFileSync(path.join(__dirname, 'stresstest_logs.txt'), logLine);
    });

    ipcMain.handle('ov-infer', async (event, inputFeaturesArray) => {
      if (!inferRequest) return null;
      try {
        const floatData = new Float32Array(inputFeaturesArray);
        const tensor = new ov.Tensor(ov.element.f32, [1, 63], floatData);
        inferRequest.setInputTensor(tensor);
        inferRequest.infer();
        const outputTensor = inferRequest.getOutputTensor();
        return Array.from(outputTensor.data);
      } catch (err) {
        console.error("[Main] Inference error:", err);
        return null;
      }
    });

    ipcMain.on('ov-infer-sync', (event, inputFeaturesArray) => {
      if (!inferRequest) {
        event.returnValue = null;
        return;
      }
      try {
        const floatData = new Float32Array(inputFeaturesArray);
        const tensor = new ov.Tensor(ov.element.f32, [1, 63], floatData);
        inferRequest.setInputTensor(tensor);
        inferRequest.infer();
        const outputTensor = inferRequest.getOutputTensor();
        event.returnValue = Array.from(outputTensor.data);
      } catch (err) {
        console.error("[Main] Sync inference error:", err);
        event.returnValue = null;
      }
    });

  } catch (err) {
    console.error("[Main] Failed to load openvino-node. Is it installed?", err);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindows()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})