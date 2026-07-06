/**
 * ChildSafetyScanner - Child safety and zone isolation
 * Integrates with FAAO/LLL capability enforcement for child protection
 */

import type { CapabilityToken } from '../../../packages/shared-kernel/src/capabilities/CapabilityToken';
import { CapabilityEnforcer } from '../../../infra/security/FAAO/CapabilityEnforcer';

export interface ChildZone {
  id: string;
  name: string;
  isolated: boolean;
  isolatedSince?: Date;
  reason?: string;
}

export interface ChildSafetyReport {
  timestamp: Date;
  zoneStatus: ChildZone[];
  threatsDetected: string[];
  safetyLevel: 'safe' | 'warning' | 'critical';
  actionsTaken: string[];
}

export class ChildSafetyScanner {
  private enforcer: CapabilityEnforcer;
  private zones: Map<string, ChildZone> = new Map();
  private reports: ChildSafetyReport[] = [];
  private maxReportHistory: number = 500;

  constructor(private token: CapabilityToken | null) {
    this.enforcer = new CapabilityEnforcer();
    this.initializeZones();
  }

  private initializeZones(): void {
    this.zones.set('zone-alpha', {
      id: 'zone-alpha',
      name: 'Child Play Zone Alpha',
      isolated: false,
    });
    this.zones.set('zone-beta', {
      id: 'zone-beta',
      name: 'Child Play Zone Beta',
      isolated: false,
    });
    this.zones.set('zone-gamma', {
      id: 'zone-gamma',
      name: 'Child Study Zone Gamma',
      isolated: false,
    });
  }

  /**
   * Performs comprehensive child safety scan
   */
  scan(): ChildSafetyReport {
    this.enforcer.require(this.token, 'RISK_ASSESSMENT_VIEW');

    const report: ChildSafetyReport = {
      timestamp: new Date(),
      zoneStatus: Array.from(this.zones.values()),
      threatsDetected: [],
      safetyLevel: 'safe',
      actionsTaken: [],
    };

    // Simulate threat detection
    const threatChance = Math.random();
    if (threatChance > 0.8) {
      report.threatsDetected.push('Elevated thermal signature detected in zone-alpha');
      report.safetyLevel = 'warning';
      report.actionsTaken.push('Initiated passive cooling sequence');
    }

    if (threatChance > 0.95) {
      report.threatsDetected.push('CRITICAL: Energy imbalance in zone-beta');
      report.safetyLevel = 'critical';
      report.actionsTaken.push('Emergency isolation triggered');
    }

    this.reports.push(report);
    if (this.reports.length > this.maxReportHistory) {
      this.reports.shift();
    }

    if (report.threatsDetected.length > 0) {
      console.warn('[CHILD-SAFETY]', report.threatsDetected.join(' | '));
    }

    return report;
  }

  /**
   * Isolates a child safety zone
   * Requires CHILD_ZONE_ISOLATE capability
   */
  isolateChildZone(zoneId: string, reason: string): boolean {
    this.enforcer.require(this.token, 'CHILD_ZONE_ISOLATE');

    const zone = this.zones.get(zoneId);
    if (!zone) {
      throw new Error(`Zone ${zoneId} not found`);
    }

    zone.isolated = true;
    zone.isolatedSince = new Date();
    zone.reason = reason;

    console.log(`[CHILD-SAFETY] Zone isolated: ${zoneId} | Reason: ${reason}`);
    return true;
  }

  /**
   * Releases a child safety zone back to normal operation
   * Requires CHILD_ZONE_ISOLATE capability
   */
  releaseChildZone(zoneId: string): boolean {
    this.enforcer.require(this.token, 'CHILD_ZONE_ISOLATE');

    const zone = this.zones.get(zoneId);
    if (!zone) {
      throw new Error(`Zone ${zoneId} not found`);
    }

    if (!zone.isolated) {
      console.log(`[CHILD-SAFETY] Zone ${zoneId} was not isolated`);
      return false;
    }

    zone.isolated = false;
    zone.isolatedSince = undefined;
    zone.reason = undefined;

    console.log(`[CHILD-SAFETY] Zone released: ${zoneId}`);
    return true;
  }

  /**
   * Gets current zone status (read-only, requires RISK_ASSESSMENT_VIEW)
   */
  getZoneStatus(): ChildZone[] {
    this.enforcer.require(this.token, 'RISK_ASSESSMENT_VIEW');
    return Array.from(this.zones.values());
  }

  /**
   * Gets safety reports (read-only, requires RISK_ASSESSMENT_VIEW)
   */
  getReports(count: number = 50): ChildSafetyReport[] {
    this.enforcer.require(this.token, 'RISK_ASSESSMENT_VIEW');
    return this.reports.slice(-count);
  }

  /**
   * Gets latest safety report
   */
  getLatestReport(): ChildSafetyReport | null {
    return this.reports.length > 0 ? this.reports[this.reports.length - 1] : null;
  }

  /**
   * Checks if any zones are isolated
   */
  hasIsolatedZones(): boolean {
    return Array.from(this.zones.values()).some(z => z.isolated);
  }

  /**
   * Gets list of isolated zones
   */
  getIsolatedZones(): ChildZone[] {
    return Array.from(this.zones.values()).filter(z => z.isolated);
  }
}
