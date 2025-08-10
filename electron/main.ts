import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { ScannedHost } from './models/ScannedHost'
import { NetworkScanner } from './services/NetworkScanner'

let mainWindow: BrowserWindow | null = null
let scanner: NetworkScanner | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js')
    },
    show: false
  })

  // Content Security Policy setzen
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' http://localhost:* ws://localhost:*;"
        ]
      }
    })
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Im Entwicklungsmodus laden wir von localhost:5173
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// IPC Handler für IP-Scanning
ipcMain.handle('start-scan', async (event, scanConfig) => {
  try {
    scanner = new NetworkScanner()
    
    // Event-Handler für Scan-Updates
    scanner.on('host-found', (host: ScannedHost) => {
      mainWindow?.webContents.send('host-found', host)
    })
    
    scanner.on('scan-progress', (progress: { current: number, total: number, currentIp: string }) => {
      mainWindow?.webContents.send('scan-progress', progress)
    })
    
    scanner.on('scan-complete', () => {
      mainWindow?.webContents.send('scan-complete')
    })
    
    await scanner.startScan(scanConfig)
    return { success: true }
  } catch (error) {
    console.error('Scan error:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('stop-scan', async () => {
  if (scanner) {
    await scanner.stopScan()
    scanner = null
  }
  return { success: true }
})
