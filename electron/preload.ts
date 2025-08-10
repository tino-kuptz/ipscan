import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  startScan: (config: any) => ipcRenderer.invoke('start-scan', config),
  stopScan: () => ipcRenderer.invoke('stop-scan'),
  onHostFound: (callback: (host: any) => void) => {
    ipcRenderer.on('host-found', (event, host) => callback(host))
  },
  onScanProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('scan-progress', (event, progress) => callback(progress))
  },
  onScanComplete: (callback: () => void) => {
    ipcRenderer.on('scan-complete', () => callback())
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  }
})

// TypeScript-Deklarationen für die globale API
declare global {
  interface Window {
    electronAPI: {
      startScan: (config: any) => Promise<any>
      stopScan: () => Promise<any>
      onHostFound: (callback: (host: any) => void) => void
      onScanProgress: (callback: (progress: any) => void) => void
      onScanComplete: (callback: () => void) => void
      removeAllListeners: (channel: string) => void
    }
  }
}
