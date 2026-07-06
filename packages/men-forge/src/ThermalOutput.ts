export interface ThermalEvent {
  forgeId: string;
  cycleId: number;
  rawThermalJoules: number;
  recoveredJoules: number;
  lostJoules: number;
  timestamp: number;
}

export class ThermalOutput {
  constructor(private recoveryEfficiency: number) {}

  generateThermalEvent(forgeId: string, cycleId: number, smeltEnergyJoules: number): ThermalEvent {
    const recovered = smeltEnergyJoules * this.recoveryEfficiency;
    const lost = smeltEnergyJoules - recovered;

    return {
      forgeId,
      cycleId,
      rawThermalJoules: smeltEnergyJoules,
      recoveredJoules: recovered,
      lostJoules: lost,
      timestamp: Date.now(),
    };
  }
}
