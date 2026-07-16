const { app, BrowserWindow, globalShortcut } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    fullscreen: true, // Tự động bật chế độ toàn màn hình (như F11)
    autoHideMenuBar: true, // Ẩn thanh menu ngang
    icon: path.join(__dirname, 'build/icon.png'),
    webPreferences: {
      nodeIntegration: true, // Cho phép dùng thư viện của Node
      contextIsolation: false, // Tắt cách ly để JS trong HTML gọi được Node
      webSecurity: false // TẮT BẢO MẬT WEB CỤC BỘ: Cho phép Three.js đọc file từ ổ C:/ D:/
    }
  })
  
  win.removeMenu() // Xóa hoàn toàn thanh Menu (File, Edit, View,...)

  win.loadFile('src/index.html')

  // Mở DevTools để debug (như F12 trên Chrome)
  // win.webContents.openDevTools()

  // BỘ CÔNG CỤ TEST ĐA MÀN HÌNH
  const TEST_SIZES = [
      { w: 1920, h: 1080, name: 'FHD 16:9' },      // phổ biến nhất
      { w: 1366, h: 768,  name: 'Laptop cũ' },      // laptop giá rẻ
      { w: 1280, h: 800,  name: 'Macbook 16:10' },  // macbook
      { w: 2560, h: 1440, name: '2K 16:9' },        // màn gaming
      { w: 3840, h: 2160, name: '4K' },             // màn 4K
      { w: 2560, h: 1080, name: 'Ultrawide 21:9' }, // ultrawide
      { w: 1024, h: 768,  name: 'Cũ 4:3' },        // máy cũ
  ];

  let sizeIdx = 0;
  // Ctrl+T để xoay vòng qua các resolution
  globalShortcut.register('CommandOrControl+T', () => {
      win.setFullScreen(false); // Tắt full screen thì mới resize cửa sổ được
      const s = TEST_SIZES[sizeIdx % TEST_SIZES.length];
      win.setSize(s.w, s.h);
      win.center(); // Đưa cửa sổ ra giữa màn hình
      win.setTitle(`[TEST: ${s.name} — ${s.w}×${s.h}]`);
      console.log(`🖥️  Testing: ${s.name} (${s.w}×${s.h})`);
      sizeIdx++;
  });

  // Ctrl+D để bật DevTools
  globalShortcut.register('CommandOrControl+D', () => {
      win.webContents.toggleDevTools();
  });

  // F11 để bật/tắt toàn màn hình
  globalShortcut.register('F11', () => {
      win.setFullScreen(!win.isFullScreen());
  });
}

app.whenReady().then(() => {
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})