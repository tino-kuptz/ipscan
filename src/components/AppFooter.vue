<template>
  <div class="footer">
    <div class="copyright">
      © 2024 IP Scanner - Netzwerk-Analyse-Tool
    </div>
    <div v-if="isScanning" class="progress-section">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progressPercentage}%` }"></div>
      </div>
      <div class="progress-text">
        {{ progress.current }} / {{ progress.total }}
      </div>
      <div class="status-message">
        {{ statusMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Progress } from '../types'

/**
 * Props für die AppFooter-Komponente
 */
interface Props {
  /** Gibt an, ob aktuell ein Scan läuft */
  isScanning: boolean
  /** Fortschrittsinformationen des aktuellen Scans */
  progress: Progress
  /** Aktuelle Status-Nachricht */
  statusMessage: string
}

const props = defineProps<Props>()

/**
 * Berechnet den Fortschritt in Prozent
 * @returns Fortschritt als Prozentwert (0-100)
 */
const progressPercentage = computed(() => {
  if (props.progress.total === 0) return 0
  return Math.round((props.progress.current / props.progress.total) * 100)
})
</script>

<style scoped>
/* Styles werden von der Haupt-App geerbt */
</style>
