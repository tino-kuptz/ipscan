/**
 * Repräsentiert einen gescannten Host mit allen relevanten Informationen
 */
export interface HostInfo {
  /** IP-Adresse des Hosts */
  ip: string
  /** Aufgelöster Hostname (falls verfügbar) */
  hostname: string | null
  /** MAC-Adresse des Hosts (falls verfügbar) */
  macAddress: string | null
  /** Gibt an, ob der Host online ist */
  isOnline: boolean
  /** Liste der offenen Ports */
  openPorts: number[]
  /** Antwortzeit in Millisekunden (falls verfügbar) */
  responseTime: number | null
}

/**
 * Konfiguration für einen Netzwerk-Scan
 */
export interface ScanConfig {
  /** Start-IP für Bereich-Scans */
  startIp: string
  /** End-IP für Bereich-Scans */
  endIp: string
  /** Subnetz-IP für Subnetz-Scans */
  subnet?: string
  /** Subnetz-Maske für Subnetz-Scans */
  subnetMask?: string
  /** Zusätzliche Ports, die gescannt werden sollen */
  additionalPorts: number[]
  /** Timeout in Millisekunden für einzelne Host-Scans */
  timeout: number
}

/**
 * Fortschrittsinformationen während eines Scans
 */
export interface Progress {
  /** Anzahl der bereits gescannten Hosts */
  current: number
  /** Gesamtanzahl der zu scannenden Hosts */
  total: number
  /** IP-Adresse des aktuell gescannten Hosts */
  currentIp: string
}
