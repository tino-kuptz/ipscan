import type { HostInfo, ScanConfig, Progress } from './index'

declare global {
  interface Window {
    electronAPI: {
      startScan: (config: ScanConfig) => Promise<{ success: boolean; error?: string }>
      stopScan: () => Promise<{ success: boolean }>
      onHostFound: (callback: (host: HostInfo) => void) => void
      onScanProgress: (callback: (progress: Progress) => void) => void
      onScanComplete: (callback: () => void) => void
    }
  }
}

export {}
