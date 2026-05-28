const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    fullscreen: true, // Tự động bật chế độ toàn màn hình (như F11)
    autoHideMenuBar: true, // Ẩn thanh menu ngang
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
}

app.whenReady().then(() => {
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})