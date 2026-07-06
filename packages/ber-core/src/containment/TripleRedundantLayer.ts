/**
 * TripleRedundantLayer - Triple redundant magnetic confinement
 * Ensures safe plasma containment with automatic failover
 */

export interface ContainmentLayer {
  id: string;
  status: 'active' | 'backup' | 'failed';
  magneticField: number; // Tesla
  frequency: number; // Hz
  power: number; // Watts
  integrity: number; // 0-1
}

export interface RedundancyStatus {
  primaryActive: boolean;
  secondaryActive: boolean;
  tertiaryActive: boolean;
  activeLayers: number;
  overallStatus: 'safe' | 'degraded' | 'critical';
}

export class TripleRedundantLayer {
  private layers: ContainmentLayer[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private failoverThreshold: number = 0.75; // 75% integrity

  constructor() {
    this.initializeLayers();
  }

  private initializeLayers(): void {
    this.layers = [
      {
        id: 'primary',
        status: 'active',
        magneticField: 8.0,
        frequency: 50,
        power: 5000000,
        integrity: 1.0,
      },
      {
        id: 'secondary',
        status: 'backup',
        magneticField: 8.0,
        frequency: 50,
        power: 5000000,
        integrity: 1.0,
      },
      {
        id: 'tertiary',
        status: 'backup',
        magneticField: 8.0,
        frequency: 50,
        power: 5000000,
        integrity: 1.0,
      },
    ];
  }

  /**
   * Activates all containment layers
   */
  activateAll(): boolean {
    for (const layer of this.layers) {
      layer.status = 'active';
    }
    return true;
  }

  /**
   * Deactivates a specific layer
   */
  deactivateLayer(layerId: string): void {
    const layer = this.layers.find((l) => l.id === layerId);
    if (layer) {
      layer.status = 'backup';
    }
  }

  /**
   * Monitors layer integrity and triggers failover if needed
   */
  startMonitoring(checkInterval: number = 1000): void {
    this.monitoringInterval = setInterval(() => {
      this.checkIntegrity();
    }, checkInterval);
  }

  /**
   * Stops monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Checks layer integrity and performs failover if needed
   */
  private checkIntegrity(): void {
    // Simulate degradation over time
    for (const layer of this.layers) {
      if (layer.status === 'active') {
        layer.integrity -= Math.random() * 0.001; // Slow degradation
        layer.integrity = Math.max(0, layer.integrity);

        if (layer.integrity < this.failoverThreshold) {
          console.warn(
            `[REDUNDANCY] Layer ${layer.id} integrity below threshold (${(layer.integrity * 100).toFixed(1)}%)`
          );
          this.triggerFailover(layer.id);
        }
      }
    }
  }

  /**
   * Triggers failover to backup layer
   */
  private triggerFailover(failedLayerId: string): void {
    const failedLayer = this.layers.find((l) => l.id === failedLayerId);
    if (!failedLayer) return;

    failedLayer.status = 'failed';
    console.warn(`[REDUNDANCY] Layer ${failedLayerId} failed, initiating failover`);

    // Find first available backup
    const backup = this.layers.find((l) => l.status === 'backup');
    if (backup) {
      backup.status = 'active';
      console.log(`[REDUNDANCY] Failover complete: ${backup.id} now active`);
    } else {
      console.error('[REDUNDANCY] No backup layer available - CRITICAL!');
    }
  }

  /**
   * Gets redundancy status
   */
  getStatus(): RedundancyStatus {
    const activeLayers = this.layers.filter((l) => l.status === 'active').length;
    let overallStatus: 'safe' | 'degraded' | 'critical';

    if (activeLayers >= 2) {
      overallStatus = 'safe';
    } else if (activeLayers === 1) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'critical';
    }

    return {
      primaryActive: this.layers[0].status === 'active',
      secondaryActive: this.layers[1].status === 'active',
      tertiaryActive: this.layers[2].status === 'active',
      activeLayers,
      overallStatus,
    };
  }

  /**
   * Gets layer details
   */
  getLayers(): ContainmentLayer[] {
    return JSON.parse(JSON.stringify(this.layers));
  }
}
