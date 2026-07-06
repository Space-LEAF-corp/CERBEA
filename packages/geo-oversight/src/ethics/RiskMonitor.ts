/**
 * RiskMonitor - Continuous risk assessment and ethical monitoring
 * Identifies potential safety and ethical issues
 */

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

export class RiskMonitor {
  private metrics: Map<string, RiskMetric> = new Map();
  private assessmentHistory: RiskAssessment[] = [];
  private maxHistorySize: number = 1000;

  constructor() {
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    const defaultMetrics = [
      { name: 'containment-integrity', category: 'safety' as const, threshold: 0.75 },
      { name: 'energy-stability', category: 'operational' as const, threshold: 0.8 },
      { name: 'grid-load-balance', category: 'operational' as const, threshold: 0.9 },
      { name: 'child-safe-status', category: 'safety' as const, threshold: 0.5 },
      { name: 'steward-override-frequency', category: 'ethical' as const, threshold: 0.3 },
      { name: 'material-disposal-risk', category: 'ethical' as const, threshold: 0.6 },
    ];

    for (const m of defaultMetrics) {
      this.metrics.set(m.name, {
        ...m,
        value: 0.2, // Initial low risk
      });
    }
  }

  /**
   * Updates a risk metric
   */
  updateMetric(name: string, value: number): void {
    const metric = this.metrics.get(name);
    if (metric) {
      metric.value = Math.max(0, Math.min(1, value)); // Clamp 0-1
    }
  }

  /**
   * Performs comprehensive risk assessment
   */
  assessRisk(): RiskAssessment {
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
        alerts.push(`⚠️ ${metric.name} exceeded threshold (${(metric.value * 100).toFixed(1)}%)`);
      }

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
   */
  getHistory(count: number = 100): RiskAssessment[] {
    return this.assessmentHistory.slice(-count);
  }

  /**
   * Gets latest assessment
   */
  getLatestAssessment(): RiskAssessment | null {
    return this.assessmentHistory.length > 0
      ? this.assessmentHistory[this.assessmentHistory.length - 1]
      : null;
  }
}
