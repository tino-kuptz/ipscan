<template>
  <div id="app">
    <div class="container">
      <!-- Scan Configuration -->
      <ScanConfig 
        :is-scanning="isScanning" 
        @start-scan="startScan" 
      />

      <!-- Scan Results -->
      <ScanResults :scanned-hosts="scannedHosts" />

      <!-- Footer -->
      <AppFooter 
        :is-scanning="isScanning"
        :progress="progress"
        :status-message="statusMessage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import ScanConfig from './components/ScanConfig.vue'
import ScanResults from './components/ScanResults.vue'
import AppFooter from './components/AppFooter.vue'
import type { HostInfo, ScanConfig as ScanConfigType, Progress } from './types'

/** Gibt an, ob aktuell ein Scan läuft */
const isScanning = ref(false)

/** Liste aller gescannten Hosts */
const scannedHosts = ref<HostInfo[]>([])

/** Fortschrittsinformationen des aktuellen Scans */
const progress = ref<Progress>({ current: 0, total: 0, currentIp: '' })

/** Aktuelle Status-Nachricht */
const statusMessage = ref('')

/**
 * Startet einen neuen Scan mit der übergebenen Konfiguration
 * @param config - Scan-Konfiguration mit IP-Bereich und Ports
 */
const startScan = async (config: ScanConfigType) => {
  try {
    isScanning.value = true
    scannedHosts.value = []
    progress.value = { current: 0, total: 0, currentIp: '' }
    statusMessage.value = 'Scan wird gestartet...'

    const result = await window.electronAPI.startScan(config)
    
    if (!result.success) {
      throw new Error(result.error || 'Unbekannter Fehler beim Scan')
    }
  } catch (error) {
    console.error('Scan error:', error)
    statusMessage.value = `Fehler: ${(error as Error).message}`
    isScanning.value = false
  }
}

/**
 * Stoppt den aktuellen Scan
 */
const stopScan = async () => {
  try {
    await window.electronAPI.stopScan()
    isScanning.value = false
    statusMessage.value = 'Scan gestoppt'
  } catch (error) {
    console.error('Stop scan error:', error)
  }
}

/**
 * Event-Handler für gefundene Hosts
 * @param host - Informationen über den gefundenen Host
 */
const handleHostFound = (host: HostInfo) => {
  const existingIndex = scannedHosts.value.findIndex(h => h.ip === host.ip)
  if (existingIndex >= 0) {
    scannedHosts.value[existingIndex] = host
  } else {
    scannedHosts.value.push(host)
  }
}

/**
 * Event-Handler für Scan-Fortschritt
 * @param progressData - Aktuelle Fortschrittsinformationen
 */
const handleScanProgress = (progressData: Progress) => {
  progress.value = progressData
  statusMessage.value = `Scanne ${progressData.currentIp}...`
}

/**
 * Event-Handler für Scan-Abschluss
 */
const handleScanComplete = () => {
  isScanning.value = false
  statusMessage.value = 'Scan abgeschlossen'
}

/**
 * Lifecycle-Hook: Wird beim Mounten der Komponente ausgeführt
 * Registriert Event-Listener für Electron IPC
 */
onMounted(() => {
  // Event listeners für Electron IPC
  window.electronAPI.onHostFound(handleHostFound)
  window.electronAPI.onScanProgress(handleScanProgress)
  window.electronAPI.onScanComplete(handleScanComplete)
})

/**
 * Lifecycle-Hook: Wird beim Unmounten der Komponente ausgeführt
 * Stoppt laufende Scans und führt Cleanup durch
 */
onUnmounted(() => {
  // Cleanup bei Komponenten-Zerstörung
  if (isScanning.value) {
    stopScan()
  }
})
</script>

<style>
/* Global styles bleiben in der Haupt-App */
</style>
