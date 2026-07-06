/**
 * ThermalAnalytics - Analytics and reporting for thermal events
 * Aggregates thermal data across forges and cycles
 */

import type { ThermalEvent } from '../../../packages/men-forge/src/smelting/ThermalOutput';

export interface ThermalSummary {
  totalRaw: number;
  totalRecovered: number;
  totalLost: number;
  recoveryRate: number;
  cycleCount: number;
  averageEfficiency: number;
}

export interface ForgeAnalytics {
  forgeId: string;
  cycleCount: number;
  totalRaw: number;
  totalRecovered: number;
  totalLost: number;
  averageRecoveryRate: number;
  minRecoveryRate: number;
  maxRecoveryRate: number;
}

export class ThermalAnalytics {
  private events: ThermalEvent[] = [];
  private forgeMetrics: Map<string, ForgeAnalytics> = new Map();

  /**
   * Records a thermal event
   */
  record(event: ThermalEvent): void {
    this.events.push(event);
    this.updateForgeMetrics(event);
  }

  /**
   * Updates forge-level metrics
   */
  private updateForgeMetrics(event: ThermalEvent): void {
    if (!this.forgeMetrics.has(event.forgeId)) {
      this.forgeMetrics.set(event.forgeId, {
        forgeId: event.forgeId,
        cycleCount: 0,
        totalRaw: 0,
        totalRecovered: 0,
        totalLost: 0,
        averageRecoveryRate: 0,
        minRecoveryRate: 1,
        maxRecoveryRate: 0,
      });
    }

    const metrics = this.forgeMetrics.get(event.forgeId)!;
    metrics.cycleCount++;
    metrics.totalRaw += event.rawEnergyJoules;
    metrics.totalRecovered += event.recoveredJoules;
    metrics.totalLost += event.lostJoules;

    // Recalculate averages
    metrics.minRecoveryRate = Math.min(metrics.minRecoveryRate, event.recoveryRate);
    metrics.maxRecoveryRate = Math.max(metrics.maxRecoveryRate, event.recoveryRate);
    
    // Average recovery rate
    const forgeEvents = this.events.filter(e => e.forgeId === event.forgeId);
    const avgRecovery = forgeEvents.reduce((sum, e) => sum + e.recoveryRate, 0) / forgeEvents.length;
    metrics.averageRecoveryRate = avgRecovery;
  }

  /**
   * Gets overall thermal summary
   */
  getSummary(): ThermalSummary {
    const totalRaw = this.events.reduce((sum, e) => sum + e.rawEnergyJoules, 0);
    const totalRecovered = this.events.reduce((sum, e) => sum + e.recoveredJoules, 0);
    const totalLost = this.events.reduce((sum, e) => sum + e.lostJoules, 0);

    return {
      totalRaw,
      totalRecovered,
      totalLost,
      recoveryRate: totalRaw > 0 ? totalRecovered / totalRaw : 0,
      cycleCount: this.events.length,
      averageEfficiency: this.events.length > 0
        ? this.events.reduce((sum, e) => sum + e.efficiency, 0) / this.events.length
        : 0,
    };
  }

  /**
   * Gets per-forge analytics
   */
  getPerForge(): ForgeAnalytics[] {
    return Array.from(this.forgeMetrics.values());
  }

  /**
   * Gets analytics for a specific forge
   */
  getForgeAnalytics(forgeId: string): ForgeAnalytics | null {
    return this.forgeMetrics.get(forgeId) || null;
  }

  /**
   * Gets all recorded events
   */
  getEvents(): ThermalEvent[] {
    return [...this.events];
  }

  /**
   * Clears all analytics
   */
  clearAll(): void {
    this.events = [];
    this.forgeMetrics.clear();
  }
}
