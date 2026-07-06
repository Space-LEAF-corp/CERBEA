/**
 * EnergyQuality - Metrics and assessment for energy characteristics
 * Tracks purity, stability, and suitability for different applications
 */

export interface EnergyQuality {
  /** Purity score (0-1): absence of contaminants */
  purity: number;

  /** Stability score (0-1): consistency and reliability */
  stability: number;

  /** Voltage regulation quality */
  voltageQuality: number;

  /** Frequency stability (for AC energy) */
  frequencyStability: number;

  /** Thermal efficiency rating */
  thermalEfficiency: number;

  /** Last assessment timestamp */
  assessedAt: Date;

  /** Assessment notes */
  notes?: string;
}

/**
 * Calculates composite quality score
 */
export function calculateQualityScore(quality: EnergyQuality): number {
  const weights = {
    purity: 0.3,
    stability: 0.25,
    voltageQuality: 0.2,
    frequencyStability: 0.15,
    thermalEfficiency: 0.1,
  };

  return (
    quality.purity * weights.purity +
    quality.stability * weights.stability +
    quality.voltageQuality * weights.voltageQuality +
    quality.frequencyStability * weights.frequencyStability +
    quality.thermalEfficiency * weights.thermalEfficiency
  );
}

/**
 * Determines if energy meets minimum quality threshold
 */
export function meetsMinimumQuality(
  quality: EnergyQuality,
  threshold: number = 0.75
): boolean {
  return calculateQualityScore(quality) >= threshold;
}

/**
 * Degrades energy quality by specified factor
 */
export function degradeQuality(quality: EnergyQuality, factor: number): EnergyQuality {
  return {
    ...quality,
    purity: Math.max(0, quality.purity - factor * 0.1),
    stability: Math.max(0, quality.stability - factor * 0.15),
    voltageQuality: Math.max(0, quality.voltageQuality - factor * 0.2),
    frequencyStability: Math.max(0, quality.frequencyStability - factor * 0.05),
    thermalEfficiency: Math.max(0, quality.thermalEfficiency - factor * 0.1),
    assessedAt: new Date(),
  };
}

/**
 * Creates ideal quality specification
 */
export function createIdealQuality(): EnergyQuality {
  return {
    purity: 1.0,
    stability: 1.0,
    voltageQuality: 1.0,
    frequencyStability: 1.0,
    thermalEfficiency: 1.0,
    assessedAt: new Date(),
  };
}
