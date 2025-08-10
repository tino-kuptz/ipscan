<template>
  <div class="scan-config">
    <!-- First Row: Dropdown and IP inputs -->
    <div class="scan-controls">
      <!-- Scan Type Dropdown -->
      <div class="scan-type-dropdown">
        <label>&nbsp;</label>
        <select v-model="scanType">
          <option value="range">IP-Bereich</option>
          <option value="subnet">Subnetz</option>
        </select>
      </div>

      <!-- IP Range Configuration -->
      <div v-if="scanType === 'range'" class="scan-inputs">
        <div class="form-group">
          <label for="startIp">Start IP</label>
          <input id="startIp" v-model="scanConfig.startIp" type="text" placeholder="192.168.1.1" />
        </div>
        <div class="form-group">
          <label for="endIp">End IP</label>
          <input id="endIp" v-model="scanConfig.endIp" type="text" placeholder="192.168.1.254" />
        </div>
      </div>

      <!-- Subnet Configuration -->
      <div v-if="scanType === 'subnet'" class="scan-inputs">
        <div class="form-group">
          <label for="subnet">Subnetz</label>
          <input id="subnet" v-model="scanConfig.subnet" type="text" placeholder="192.168.1.0" />
        </div>
        <div class="form-group">
          <label for="subnetMask">Maske</label>
          <input id="subnetMask" v-model="scanConfig.subnetMask" type="text" placeholder="255.255.255.0" />
        </div>
      </div>
    </div>

    <!-- Second Row: Ports and Button -->
    <div class="scan-controls">
      <!-- Additional Ports -->
      <div class="form-group">
        <label for="additionalPorts">Zusätzliche Ports</label>
        <input id="additionalPorts" v-model="additionalPortsInput" type="text" placeholder="8080, 8443, 9000" />
      </div>

      <!-- Scan Button -->
      <button class="scan-button" @click="startScan" :disabled="isScanning || !isValidConfig">
        <span v-if="isScanning">
          <span class="loading"></span>
          Scanne...
        </span>
        <span v-else>
          Scan starten
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ScanConfig } from '../types'

/**
 * Props für die ScanConfig-Komponente
 */
interface Props {
  /** Gibt an, ob aktuell ein Scan läuft */
  isScanning: boolean
}

/**
 * Events, die von der ScanConfig-Komponente emittiert werden
 */
interface Emits {
  /** Wird emittiert, wenn ein neuer Scan gestartet werden soll */
  (e: 'start-scan', config: ScanConfig): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

/** Aktuell ausgewählter Scan-Typ */
const scanType = ref<'range' | 'subnet'>('range')

/** Konfiguration für den Scan */
const scanConfig = ref<ScanConfig>({
  startIp: '192.168.1.1',
  endIp: '192.168.1.254',
  additionalPorts: [],
  timeout: 5000
})

/** Eingabe für zusätzliche Ports */
const additionalPortsInput = ref('')

/**
 * Überprüft, ob die aktuelle Konfiguration gültig ist
 * @returns true wenn alle erforderlichen Felder ausgefüllt sind
 */
const isValidConfig = computed(() => {
  if (scanType.value === 'range') {
    return scanConfig.value.startIp && scanConfig.value.endIp
  } else {
    return scanConfig.value.subnet && scanConfig.value.subnetMask
  }
})

/**
 * Parst die Eingabe für zusätzliche Ports
 * @param input - Komma-getrennte Liste von Port-Nummern
 * @returns Array mit gültigen Port-Nummern (1-65535)
 */
const parseAdditionalPorts = (input: string): number[] => {
  if (!input.trim()) return []
  return input
    .split(',')
    .map(port => parseInt(port.trim()))
    .filter(port => !isNaN(port) && port > 0 && port <= 65535)
}

/**
 * Startet einen neuen Scan mit der aktuellen Konfiguration
 */
const startScan = () => {
  const config = {
    ...scanConfig.value,
    additionalPorts: parseAdditionalPorts(additionalPortsInput.value)
  }
  emit('start-scan', config)
}

/**
 * Überwacht Änderungen des Scan-Typs und setzt nicht relevante Felder zurück
 */
watch(scanType, (newType) => {
  if (newType === 'range') {
    scanConfig.value.subnet = undefined
    scanConfig.value.subnetMask = undefined
  } else {
    scanConfig.value.startIp = ''
    scanConfig.value.endIp = ''
  }
})
</script>

<style scoped>
/* Styles werden von der Haupt-App geerbt */
</style>
