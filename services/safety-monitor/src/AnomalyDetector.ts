/**
 * AnomalyDetector - Real-time anomaly detection and safety monitoring
 * Monitors system metrics for anomalies that could indicate safety issues
 */

export interface SystemMetric {
  name: string;
  value: number;
  timestamp: Date;
  expectedRange: [number, number];
}

export interface Anomaly {
  id: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'warning' | 'critical';
  detected: Date;
}

export class AnomalyDetector {
  private metrics: Map<string, SystemMetric[]> = new Map();
  private anomalies: Anomaly[] = [];
  private windowSize: number = 100; // Keep last 100 readings

  /**
   * Record a system metric
   */
  recordMetric(metric: SystemMetric): void {
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }

    const history = this.metrics.get(metric.name)!;
    history.push(metric);

    // Keep sliding window
    if (history.length > this.windowSize) {
      history.shift();
    }

    // Check for anomalies
    this.detectAnomalies(metric);
  }

  /**
   * Detects anomalies in current metric
   */
  private detectAnomalies(metric: SystemMetric): void {
    const [min, max] = metric.expectedRange;

    // Check if value is outside expected range
    if (metric.value < min || metric.value > max) {
      const severity = this.calculateSeverity(metric.value, min, max);

      const anomaly: Anomaly = {
        id: `anom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        metric: metric.name,
        value: metric.value,
        threshold: metric.value > max ? max : min,
        severity,
        detected: metric.timestamp,
      };

      this.anomalies.push(anomaly);
      this.triggerAlert(anomaly);
    }
  }

  /**
   * Calculates severity based on deviation from expected range
   */
  private calculateSeverity(
    value: number,
    min: number,
    max: number
  ): 'warning' | 'critical' {
    const range = max - min;
    const expectedCenter = (min + max) / 2;
    const deviation = Math.abs(value - expectedCenter);
    const percentDeviation = (deviation / range) * 100;

    return percentDeviation > 50 ? 'critical' : 'warning';
  }

  /**
   * Triggers alert for anomaly
   */
  private triggerAlert(anomaly: Anomaly): void {
    const severity = anomaly.severity === 'critical' ? '⚠️ CRITICAL' : '⚠️ WARNING';
    console.log(
      `${severity} [ANOMALY DETECTOR] ${anomaly.metric}: ${anomaly.value.toFixed(2)} (threshold: ${anomaly.threshold.toFixed(2)})`
    );

    if (anomaly.severity === 'critical') {
      // TODO: Notify safety monitor and orchestrator
    }
  }

  /**
   * Gets recent anomalies
   */
  getRecentAnomalies(count: number = 10): Anomaly[] {
    return this.anomalies.slice(-count);
  }

  /**
   * Gets metric history
   */
  getMetricHistory(name: string): SystemMetric[] {
    return this.metrics.get(name) || [];
  }

  /**
   * Clears old anomalies (older than hours)
   */
  clearOldAnomalies(hours: number = 24): void {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    this.anomalies = this.anomalies.filter((a) => a.detected > cutoffTime);
  }
}
