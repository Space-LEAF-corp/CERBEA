/**
 * Enhanced RiskMonitor with FAAO/LLL capability integration
 * Continuous risk assessment with capability-based access control
 */

import type { CapabilityToken } from '../../../packages/shared-kernel/src/capabilities/CapabilityToken';
import { CapabilityEnforcer } from '../../../infra/security/FAAO/CapabilityEnforcer';

export interface RiskMetric {
  name: string;
  value: number; // 0-1 risk level
  threshold: number; // Alert threshold
  category: 'safety' | 'ethical' | 'operational';
}

export interface RiskAssessment {
  timestamp: Date;
  overallRisk: number; // 0-1
  metrics: RiskMetric[];
  alerts: string[];
  requiresStewardReview: boolean;
}

export interface ThermalSurplussCheckResult {
  level: 'ok' | 'warning' | 'critical';
  reason: string;
  recommendation?: string;
}

export interface ThermalSurplussSummary {
  totalRaw: number;
  totalRecovered: number;
  totalLost: number;
  recoveryRate: number;
}

export class RiskMonitor {
  private metrics: Map<string, RiskMetric> = new Map();
  private assessmentHistory: RiskAssessment[] = [];
  private maxHistorySize: number = 1000;
  private enforcer: CapabilityEnforcer;
  private viewToken: CapabilityToken | null;

  constructor(token?: CapabilityToken | null) {
    this.enforcer = new CapabilityEnforcer();
    this.viewToken = token || null;
    this.initializeMetrics();
  }

  /**
   * Sets or updates the viewing token for capability enforcement
   */
  setToken(token: CapabilityToken | null): void {
    this.viewToken = token;
  }

  private initializeMetrics(): void {
    const defaultMetrics = [
      { name: 'containment-integrity', category: 'safety' as const, threshold: 0.75 },
      { name: 'energy-stability', category: 'operational' as const, threshold: 0.8 },
      { name: 'grid-load-balance', category: 'operational' as const, threshold: 0.9 },
      { name: 'child-safe-status', category: 'safety' as const, threshold: 0.5 },
      { name: 'steward-override-frequency', category: 'ethical' as const, threshold: 0.3 },
      { name: 'material-disposal-risk', category: 'ethical' as const, threshold: 0.6 },
      { name: 'forge-thermal-recovery', category: 'operational' as const, threshold: 0.9 },
    ];

    for (const m of defaultMetrics) {
      this.metrics.set(m.name, {
        ...m,
        value: 0.2, // Initial low risk
      });
    }
  }

  /**
   * Updates a risk metric (requires STEWARD_REVIEW capability)
   */
  updateMetric(name: string, value: number): void {
    // Allow updates without token for internal operations
    // but audit the action
    const metric = this.metrics.get(name);
    if (metric) {
      metric.value = Math.max(0, Math.min(1, value)); // Clamp 0-1
      if (this.viewToken) {
        this.enforcer.audit(this.viewToken, 'STEWARD_REVIEW', true);
      }
    }
  }

  /**
   * Checks forge thermal surplus recovery rate
   * Requires THERMAL_ANALYTICS_VIEW capability for access
   */
  checkForgeThermalSurplus(summary: ThermalSurplussSummary): ThermalSurplussCheckResult {
    this.enforcer.require(this.viewToken, 'THERMAL_ANALYTICS_VIEW');

    const { totalRaw, totalRecovered, totalLost, recoveryRate } = summary;

    // Update the thermal recovery metric
    const riskValue = 1 - recoveryRate; // Invert: lower recovery = higher risk
    this.updateMetric('forge-thermal-recovery', riskValue);

    // Critical: recovery rate significantly below target
    if (recoveryRate < 0.85) {
      return {
        level: 'critical',
        reason: `Forge thermal recovery critically low: ${(recoveryRate * 100).toFixed(1)}% (below 85% threshold)`,
        recommendation: 'Immediate inspection required. Check thermal containment and recovery systems.',
      };
    }

    // Warning: recovery rate below optimal
    if (recoveryRate < 0.9) {
      return {
        level: 'warning',
        reason: `Forge thermal recovery below threshold: ${(recoveryRate * 100).toFixed(1)}%`,
        recommendation: 'Monitor thermal efficiency. Schedule maintenance if trend continues.',
      };
    }

    // OK: recovery rate acceptable
    return {
      level: 'ok',
      reason: `Forge thermal recovery nominal: ${(recoveryRate * 100).toFixed(1)}%`,
    };
  }

  /**
   * Performs comprehensive risk assessment
   * Requires RISK_ASSESSMENT_VIEW capability
   */
  assessRisk(): RiskAssessment {
    this.enforcer.require(this.viewToken, 'RISK_ASSESSMENT_VIEW');

    const metrics = Array.from(this.metrics.values());
    const alerts: string[] = [];
    let overallRisk = 0;

    // Calculate weighted overall risk
    let safetyRisk = 0;
    let ethicalRisk = 0;
    let operationalRisk = 0;
    let count = { safety: 0, ethical: 0, operational: 0 };

    for (const metric of metrics) {
      if (metric.value > metric.threshold) {
        alerts.push(`⚠️ ${metric.name} exceeded threshold (${(metric.value * 100).toFixed(1)}%)`);  }

      if (metric.category === 'safety') {
        safetyRisk += metric.value;
        count.safety++;
      } else if (metric.category === 'ethical') {
        ethicalRisk += metric.value;
        count.ethical++;
      } else {
        operationalRisk += metric.value;
        count.operational++;
      }
    }

    // Average by category
    safetyRisk = count.safety > 0 ? safetyRisk / count.safety : 0;
    ethicalRisk = count.ethical > 0 ? ethicalRisk / count.ethical : 0;
    operationalRisk = count.operational > 0 ? operationalRisk / count.operational : 0;

    // Weighted overall (safety weighted highest)
    overallRisk = safetyRisk * 0.5 + ethicalRisk * 0.3 + operationalRisk * 0.2;

    const assessment: RiskAssessment = {
      timestamp: new Date(),
      overallRisk,
      metrics,
      alerts,
      requiresStewardReview: overallRisk > 0.7 || ethicalRisk > 0.8,
    };

    // Store assessment
    this.assessmentHistory.push(assessment);
    if (this.assessmentHistory.length > this.maxHistorySize) {
      this.assessmentHistory.shift();
    }

    if (assessment.alerts.length > 0) {
      console.warn('[RISK]', assessment.alerts.join(' | '));
    }

    return assessment;
  }

  /**
   * Gets risk assessment history
   * Requires RISK_ASSESSMENT_VIEW capability
   */
  getHistory(count: number = 100): RiskAssessment[] {
    this.enforcer.require(this.viewToken, 'RISK_ASSESSMENT_VIEW');
    return this.assessmentHistory.slice(-count);
  }

  /**
   * Gets latest assessment
   * Requires RISK_ASSESSMENT_VIEW capability
   */
  getLatestAssessment(): RiskAssessment | null {
    this.enforcer.require(this.viewToken, 'RISK_ASSESSMENT_VIEW');
    return this.assessmentHistory.length > 0
      ? this.assessmentHistory[this.assessmentHistory.length - 1]
      : null;
  }

  /**
   * Clears assessment history (requires STEWARD_REVIEW capability)
   */
  clearHistory(): void {
    this.enforcer.require(this.viewToken, 'STEWARD_REVIEW');
    this.assessmentHistory = [];
    console.log('[RISK] Assessment history cleared');
  }

  /**
   * Gets metrics accessible to current token holder
   */
  getAccessibleMetrics(): RiskMetric[] {
    this.enforcer.require(this.viewToken, 'RISK_ASSESSMENT_VIEW');
    return Array.from(this.metrics.values());
  }

  /**
   * Emergency override - requires GEO_OVERRIDE capability
   */
  emergencyOverride(metric: string, value: number, reason: string): void {
    this.enforcer.require(this.viewToken, 'GEO_OVERRIDE');
    const m = this.metrics.get(metric);
    if (m) {
      m.value = value;
      console.log(`[RISK-OVERRIDE] ${metric} set to ${value} | Reason: ${reason}`);
      this.enforcer.audit(this.viewToken, 'GEO_OVERRIDE', true);
    }
  }
}
