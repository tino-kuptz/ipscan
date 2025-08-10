import { EventEmitter } from 'events'
import * as net from 'net'
import * as dns from 'dns'
import { promisify } from 'util'
import * as ping from 'ping'

const dnsLookup = promisify(dns.lookup)

export interface ScanConfig {
  startIp: string
  endIp: string
  subnet?: string
  subnetMask?: string
  additionalPorts: number[]
  timeout: number
}

export interface HostInfo {
  ip: string
  hostname: string | null
  macAddress: string | null
  isOnline: boolean
  openPorts: number[]
  responseTime: number | null
}

export class ScannedHost extends EventEmitter {
  public ip: string
  public hostname: string | null = null
  public macAddress: string | null = null
  public isOnline: boolean = false
  public openPorts: number[] = []
  public responseTime: number | null = null
  public wasScanned: boolean = false

  constructor(ip: string) {
    super()
    this.ip = ip
  }

  async scan(config: ScanConfig): Promise<void> {
    this.wasScanned = true
    
    try {
      // Ping-Test für Online-Status
      const pingResult = await this.pingHost(config.timeout)
      this.isOnline = pingResult.isOnline
      this.responseTime = pingResult.responseTime

      if (this.isOnline) {
        // Hostname auflösen
        try {
          const hostnameResult = await dnsLookup(this.ip)
          // DNS lookup gibt [hostname, family] zurück
          this.hostname = Array.isArray(hostnameResult) ? hostnameResult[0] : this.ip
        } catch (error) {
          console.log(`Could not resolve hostname for ${this.ip}:`, error.message)
          this.hostname = this.ip
        }

        // MAC-Adresse ermitteln (vereinfacht)
        this.macAddress = await this.getMacAddress()

        // Port-Scanning
        await this.scanPorts(config.additionalPorts, config.timeout)
      }

      // Event auslösen
      this.emit('scan-complete', this)
    } catch (error) {
      console.error(`Error scanning ${this.ip}:`, error)
      this.emit('scan-error', error)
    }
  }

  private async pingHost(timeout: number): Promise<{ isOnline: boolean; responseTime: number | null }> {
    try {
      const result = await ping.promise.probe(this.ip, {
        timeout: timeout / 1000, // ping expects seconds
        min_reply: 1
      })
      
      return {
        isOnline: result.alive,
        responseTime: result.alive ? result.time : null
      }
    } catch (error) {
      console.log(`Ping failed for ${this.ip}:`, error.message)
      return {
        isOnline: false,
        responseTime: null
      }
    }
  }

  private async getMacAddress(): Promise<string | null> {
    // Vereinfachte MAC-Adress-Erkennung
    // In einer echten Implementierung würde man ARP-Tabellen oder andere Methoden verwenden
    try {
      // Für Demo-Zwecke generieren wir eine zufällige MAC-Adresse
      const macParts = []
      for (let i = 0; i < 6; i++) {
        macParts.push(Math.floor(Math.random() * 256).toString(16).padStart(2, '0'))
      }
      return macParts.join(':').toUpperCase()
    } catch (error) {
      console.log(`Could not get MAC address for ${this.ip}:`, error.message)
      return null
    }
  }

  private async scanPorts(ports: number[], timeout: number): Promise<void> {
    // Alle vom User übergebenen Ports in Promises mappen
    const scanPromises = ports.map(port => this.scanPort(port, timeout))
    const results = await Promise.allSettled(scanPromises)
    

    // Und nach offenen Ports filtern
    this.openPorts = results
      .map((result, index) => result.status === 'fulfilled' && result.value ? ports[index] : null)
      .filter(port => port !== null) as number[]
  }

  private async scanPort(port: number, timeout: number): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket()
      
      const timer = setTimeout(() => {
        socket.destroy()
        resolve(false)
      }, timeout)

      socket.connect(port, this.ip, () => {
        clearTimeout(timer)
        socket.destroy()
        resolve(true)
      })

      socket.on('error', () => {
        clearTimeout(timer)
        socket.destroy()
        resolve(false)
      })
    })
  }

  toApi(): HostInfo {
    return {
      ip: this.ip,
      hostname: this.hostname,
      macAddress: this.macAddress,
      isOnline: this.isOnline,
      openPorts: this.openPorts,
      responseTime: this.responseTime
    }
  }
}
