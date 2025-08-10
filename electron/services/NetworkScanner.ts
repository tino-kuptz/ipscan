import { EventEmitter } from 'events'
import { ScannedHost, ScanConfig } from '../models/ScannedHost'

export class NetworkScanner extends EventEmitter {
  private isScanning: boolean = false
  private currentScanConfig: ScanConfig | null = null
  private scannedHosts: Map<string, ScannedHost> = new Map()

  async startScan(config: ScanConfig): Promise<void> {
    if (this.isScanning) {
      throw new Error('Scan already in progress')
    }

    this.isScanning = true
    this.currentScanConfig = config
    this.scannedHosts.clear()

    try {
      const ipRange = this.generateIpRange(config)
      console.log(`Starting scan of ${ipRange.length} IP addresses with concurrency of 10`)

      // Batch-Größe für parallele Scans
      const batchSize = 10
      let completedCount = 0

      // IPs in Batches aufteilen
      for (let i = 0; i < ipRange.length; i += batchSize) {
        if (!this.isScanning) {
          break // Scan wurde gestoppt
        }

        const batch = ipRange.slice(i, i + batchSize)
        const batchPromises = batch.map(async (ip) => {
          const host = new ScannedHost(ip)
          
          // Event-Handler für Host-Updates
          host.on('scan-complete', (scannedHost: ScannedHost) => {
            this.scannedHosts.set(ip, scannedHost)
            this.emit('host-found', scannedHost.toApi())
          })

          try {
            await host.scan(config)
          } catch (error) {
            console.error(`Error scanning ${ip}:`, error)
          }
        })

        // Batch parallel ausführen
        await Promise.all(batchPromises)

        // Fortschritt für alle Hosts im Batch melden
        completedCount += batch.length
        this.emit('scan-progress', {
          current: completedCount,
          total: ipRange.length,
          currentIp: batch[batch.length - 1] // Letzte IP im Batch
        })

        // Kleine Pause zwischen Batches um das Netzwerk nicht zu überlasten
        if (i + batchSize < ipRange.length) {
          await this.delay(50)
        }
      }

      if (this.isScanning) {
        this.emit('scan-complete')
      }
    } catch (error) {
      console.error('Network scan error:', error)
      this.emit('scan-error', error)
    } finally {
      this.isScanning = false
      this.currentScanConfig = null
    }
  }

  async stopScan(): Promise<void> {
    this.isScanning = false
    console.log('Scan stopped by user')
  }

  private generateIpRange(config: ScanConfig): string[] {
    const ips: string[] = []

    if (config.subnet && config.subnetMask) {
      // Subnet-Scanning
      ips.push(...this.generateSubnetIps(config.subnet, config.subnetMask))
    } else {
      // IP-Bereich-Scanning
      ips.push(...this.generateRangeIps(config.startIp, config.endIp))
    }

    return ips
  }

  private generateRangeIps(startIp: string, endIp: string): string[] {
    const ips: string[] = []
    const start = this.ipToNumber(startIp)
    const end = this.ipToNumber(endIp)

    for (let i = start; i <= end; i++) {
      ips.push(this.numberToIp(i))
    }

    return ips
  }

  private generateSubnetIps(subnet: string, mask: string): string[] {
    const ips: string[] = []
    const subnetNum = this.ipToNumber(subnet)
    const maskNum = this.ipToNumber(mask)
    const networkNum = subnetNum & maskNum
    const hostBits = 32 - this.getMaskBits(maskNum)
    const totalHosts = Math.pow(2, hostBits) - 2 // -2 für Network und Broadcast

    for (let i = 1; i <= totalHosts; i++) {
      const ipNum = networkNum + i
      ips.push(this.numberToIp(ipNum))
    }

    return ips
  }

  private ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0
  }

  private numberToIp(num: number): string {
    return [
      (num >>> 24) & 255,
      (num >>> 16) & 255,
      (num >>> 8) & 255,
      num & 255
    ].join('.')
  }

  private getMaskBits(mask: number): number {
    let bits = 0
    for (let i = 31; i >= 0; i--) {
      if ((mask & (1 << i)) !== 0) {
        bits++
      } else {
        break
      }
    }
    return bits
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  getScanStatus(): { isScanning: boolean; scannedCount: number } {
    return {
      isScanning: this.isScanning,
      scannedCount: this.scannedHosts.size
    }
  }

  getScannedHosts(): any[] {
    return Array.from(this.scannedHosts.values()).map(host => host.toApi())
  }
}
