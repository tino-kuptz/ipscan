<template>
  <div class="results-section">
    <div class="results-header">
      <h2>Scan-Ergebnisse</h2>
      <div class="results-controls">
        <div class="filter-controls">
          <select v-model="activeFilter" class="filter-select">
            <option value="all">Alle ({{ scannedHosts.length }})</option>
            <option value="online">Online ({{ onlineHostsCount }})</option>
            <option value="offline">Offline ({{ offlineHostsCount }})</option>
            <option value="ports">Nur Ports ({{ portsHostsCount }})</option>
          </select>
        </div>
      </div>
    </div>

    <div class="table-container">
      <!-- Results Table -->
      <table v-if="scannedHosts.length > 0" class="hosts-table">
        <thead>
          <tr>
            <th @click="sortBy('ip')" class="sortable">
              IP-Adresse
              <span v-if="sortField === 'ip'" class="sort-indicator">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="sortBy('hostname')" class="sortable">
              Hostname
              <span v-if="sortField === 'hostname'" class="sort-indicator">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th>MAC-Adresse</th>
            <th>Status</th>
            <th>Ports</th>
            <th>Antwortzeit</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="host in sortedHosts" :key="host.ip">
            <td>{{ host.ip }}</td>
            <td>{{ host.hostname || '-' }}</td>
            <td>{{ host.macAddress || '-' }}</td>
            <td>
              <span :class="host.isOnline ? 'host-online' : 'host-offline'">
                {{ host.isOnline ? 'Online' : 'Offline' }}
              </span>
            </td>
            <td>
              <div v-if="host.openPorts.length > 0" class="ports-list">
                <span v-for="port in host.openPorts" :key="port" class="port-badge">
                  {{ port }}
                </span>
              </div>
              <span v-else>-</span>
            </td>
            <td>
              {{ host.responseTime ? `${host.responseTime}ms` : '-' }}
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">
        <!-- Empty State -->
        <h3>Keine Ergebnisse</h3>
        <p>Starten Sie einen Scan, um Hosts in Ihrem Netzwerk zu finden.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { HostInfo } from '../types'

/**
 * Props für die ScanResults-Komponente
 */
interface Props {
  /** Liste aller gescannten Hosts */
  scannedHosts: HostInfo[]
}

const props = defineProps<Props>()

/** Aktuelles Sortierfeld */
const sortField = ref<'ip' | 'hostname' | null>('ip')

/** Aktuelle Sortierrichtung */
const sortDirection = ref<'asc' | 'desc'>('asc')

/** Aktiver Filter für die Anzeige */
const activeFilter = ref<'all' | 'online' | 'offline' | 'ports'>('all')

/**
 * Filtert die Hosts basierend auf dem aktiven Filter
 * @returns Gefilterte Liste der Hosts
 */
const filteredHosts = computed(() => {
  let filtered = props.scannedHosts

  switch (activeFilter.value) {
    case 'online':
      filtered = filtered.filter(host => host.isOnline)
      break
    case 'offline':
      filtered = filtered.filter(host => !host.isOnline)
      break
    case 'ports':
      filtered = filtered.filter(host => host.openPorts.length > 0)
      break
    case 'all':
    default:
      // Alle Hosts anzeigen
      break
  }

  return filtered
})

/**
 * Sortiert die gefilterten Hosts basierend auf dem aktuellen Sortierfeld
 * @returns Sortierte Liste der Hosts
 */
const sortedHosts = computed(() => {
  if (!sortField.value) {
    return filteredHosts.value
  }

  return [...filteredHosts.value].sort((a, b) => {
    let aValue: string | number
    let bValue: string | number

    if (sortField.value === 'ip') {
      // Numerische IP-Sortierung
      aValue = ipToNumber(a.ip)
      bValue = ipToNumber(b.ip)
    } else if (sortField.value === 'hostname') {
      // Hostname-Sortierung (alphabetisch)
      aValue = a.hostname || a.ip
      bValue = b.hostname || b.ip
    } else {
      return 0
    }

    if (aValue < bValue) {
      return sortDirection.value === 'asc' ? -1 : 1
    }
    if (aValue > bValue) {
      return sortDirection.value === 'asc' ? 1 : -1
    }
    return 0
  })
})

/**
 * Anzahl der online Hosts
 */
const onlineHostsCount = computed(() => {
  return props.scannedHosts.filter(host => host.isOnline).length
})

/**
 * Anzahl der offline Hosts
 */
const offlineHostsCount = computed(() => {
  return props.scannedHosts.filter(host => !host.isOnline).length
})

/**
 * Anzahl der Hosts mit offenen Ports
 */
const portsHostsCount = computed(() => {
  return props.scannedHosts.filter(host => host.openPorts.length > 0).length
})

/**
 * Konvertiert eine IP-Adresse in eine Zahl für numerische Sortierung
 * @param ip - IP-Adresse im Format "x.x.x.x"
 * @returns Numerischer Wert der IP-Adresse
 */
const ipToNumber = (ip: string): number => {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0
}

/**
 * Ändert das Sortierfeld und die Sortierrichtung
 * @param field - Feld nach dem sortiert werden soll
 */
const sortBy = (field: 'ip' | 'hostname') => {
  if (sortField.value === field) {
    // Toggle direction if same field
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    // New field, start with ascending
    sortField.value = field
    sortDirection.value = 'asc'
  }
}
</script>

<style scoped>
/* Styles werden von der Haupt-App geerbt */
</style>
