/**
 * ThermalOutput - Thermal event generation and recovery calculation
 * Tracks energy generation, recovery, and losses in forge operations
 */

export interface ThermalEvent {
  forgeId: string;
  cycleId: number;
  timestamp: Date;
  rawEnergyJoules: number;
  recoveredJoules: number;
  lostJoules: number;
  recoveryRate: number; // 0-1, percentage of energy recovered
  efficiency: number; // overall efficiency
}

export class ThermalOutput {
  private targetEfficiency: number;
  private events: ThermalEvent[] = [];

  constructor(targetEfficiency: number = 0.94) {
    if (targetEfficiency < 0 || targetEfficiency > 1) {
      throw new Error('Target efficiency must be between 0 and 1');
    }
    this.targetEfficiency = targetEfficiency;
  }

  /**
   * Generates a thermal event for a forge cycle
   */
  generateThermalEvent(
    forgeId: string,
    cycleId: number,
    smeltEnergyJoules: number
  ): ThermalEvent {
    // Calculate recovery based on target efficiency with some variation
    const efficiencyVariation = (Math.random() - 0.5) * 0.05; // ±2.5% variation
    const actualRecoveryRate = Math.min(1, Math.max(0.85, this.targetEfficiency + efficiencyVariation));
    
    const recoveredJoules = smeltEnergyJoules * actualRecoveryRate;
    const lostJoules = smeltEnergyJoules - recoveredJoules;
    
    const event: ThermalEvent = {
      forgeId,
      cycleId,
      timestamp: new Date(),
      rawEnergyJoules: smeltEnergyJoules,
      recoveredJoules,
      lostJoules,
      recoveryRate: actualRecoveryRate,
      efficiency: this.targetEfficiency,
    };

    this.events.push(event);
    return event;
  }

  /**
   * Gets all recorded thermal events
   */
  getEvents(): ThermalEvent[] {
    return [...this.events];
  }

  /**
   * Clears event history
   */
  clearEvents(): void {
    this.events = [];
  }

  /**
   * Gets target efficiency
   */
  getTargetEfficiency(): number {
    return this.targetEfficiency;
  }

  /**
   * Sets target efficiency
   */
  setTargetEfficiency(efficiency: number): void {
    if (efficiency < 0 || efficiency > 1) {
      throw new Error('Target efficiency must be between 0 and 1');
    }
    this.targetEfficiency = efficiency;
  }
}
