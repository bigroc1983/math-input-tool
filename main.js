const { app, BrowserWindow, globalShortcut, ipcMain, clipboard } = require('electron');
const { exec } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 80,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.hide();

  globalShortcut.register('CommandOrControl+Shift+M', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.setPosition(300, 200);
      mainWindow.setAlwaysOnTop(true, 'screen-saver');
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // 粘贴处理：写入剪贴板 → 延迟隐藏窗口 → 模拟 Ctrl+V
  ipcMain.on('insert-text', (event, text) => {
    clipboard.writeText(text);

    // 先隐藏窗口，让焦点回到目标应用（关键！）
    mainWindow.hide();

    // 等 50ms 后焦点已转移，再发送按键
    setTimeout(() => {
      // 更稳定的 Ctrl+V 模拟
      const psScript = `
        Add-Type -AssemblyName System.Windows.Forms;
        [System.Windows.Forms.SendKeys]::SendWait('^v')
      `;
      exec(`powershell -command "${psScript}"`, (error) => {
        if (error) {
          console.error('自动粘贴失败，请手动 Ctrl+V:', error.message);
        }
      });
    }, 80);
  });

  // Esc 关闭窗口
  ipcMain.on('hide-window', () => {
    mainWindow.hide();
  });
}

app.whenReady().then(createWindow);

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});