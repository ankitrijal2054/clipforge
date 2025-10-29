import { app, shell, BrowserWindow, ipcMain, protocol, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc'

function createWindow(): BrowserWindow {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform !== 'darwin' ? { icon: join(__dirname, '../../resources/icon.png') } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// Register custom scheme privileges BEFORE app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'clipforge',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
      bypassCSP: true
    }
  }
])

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Map clipforge:// absolute paths to real files
  protocol.registerFileProtocol('clipforge', (request, callback) => {
    try {
      const url = request.url
      // clipforge:///Users/.. → /Users/..
      const filePath = decodeURIComponent(url.replace('clipforge://', ''))
      callback({ path: filePath })
    } catch (e) {
      console.error('clipforge protocol error:', e)
      callback({ path: '' })
    }
  })

  // Set up permission handler for camera and microphone via session
  session.defaultSession.setPermissionCheckHandler((_webContents, _permission) => {
    // Allow all permissions (camera, microphone, media, etc.)
    console.log(`Permission check requested for: ${_permission}`)
    return true
  })

  // Handle permission requests - automatically grant camera/microphone/media
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    console.log(`Permission request for: ${permission}`)
    // Grant media and related permissions
    if (permission === 'media') {
      console.log(`Automatically granting ${permission} permission`)
      callback(true)
      return
    }
    console.log(`Denying permission: ${permission}`)
    callback(false)
  })

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.clipforge.app')

  // Set app name for better cross-platform support
  app.setName('ClipForge')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Fullscreen toggle handler
  ipcMain.handle('window:toggleFullscreen', async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    if (focusedWindow) {
      focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
      console.log('📺 Fullscreen toggled:', focusedWindow.isFullScreen())
    }
  })

  // Create window and register IPC handlers
  const mainWindow = createWindow()
  registerIpcHandlers(mainWindow)

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      const newWindow = createWindow()
      registerIpcHandlers(newWindow)
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Cleanup on app quit
app.on('before-quit', async () => {
  try {
    console.log('Performing cleanup on app quit...')
    // Trigger recording cleanup via IPC handler
    await ipcMain.handleOnce('recording:cleanup', async () => {
      // This will be handled by the handler, just trigger it
      return { success: true, cleanedFiles: 0 }
    })
  } catch (error) {
    console.error('Error during app cleanup:', error)
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
