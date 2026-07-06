/**
 * AlgaePanel - Genetically optimized algae photosynthesis system
 * Converts light energy into chemical energy and oxygen
 */

export interface AlgaeConditions {
  lightIntensity: number; // 0-1000 µmol/m²/s
  temperature: number; // °C
  ph: number; // pH level
  co2Level: number; // ppm
  nutrientLevel: number; // 0-1
}

export interface PhotosynthesisOutput {
  glucoseProduction: number; // grams/hour
  oxygenProduction: number; // liters/hour
  energyCaptured: number; // Joules
  efficiency: number; // 0-1 (% of incident light energy captured)
}

export class AlgaePanel {
  private panelId: string;
  private conditions: AlgaeConditions;
  private totalBiomass: number = 100; // grams
  private harvestInterval: number = 86400000; // 24 hours in ms
  private lastHarvest: Date = new Date();

  // Algae-specific constants
  private maxPhotosynthesisRate: number = 0.15; // 15% theoretical max efficiency
  private optimalLight: number = 500; // µmol/m²/s
  private optimalTemp: number = 25; // °C
  private optimalPH: number = 7.5;

  constructor(panelId: string) {
    this.panelId = panelId;
    this.conditions = {
      lightIntensity: 0,
      temperature: 25,
      ph: 7.5,
      co2Level: 400,
      nutrientLevel: 1.0,
    };
  }

  /**
   * Updates environmental conditions
   */
  updateConditions(conditions: Partial<AlgaeConditions>): void {
    this.conditions = { ...this.conditions, ...conditions };
  }

  /**
   * Calculates photosynthesis output
   */
  calculatePhotosynthesis(): PhotosynthesisOutput {
    // Light saturation curve
    const lightFactor = Math.min(
      1.0,
      this.conditions.lightIntensity / this.optimalLight
    );

    // Temperature adjustment (Gaussian curve around optimal)
    const tempDeviation = Math.abs(this.conditions.temperature - this.optimalTemp);
    const tempFactor = Math.exp(-(tempDeviation ** 2) / 100);

    // pH adjustment
    const phDeviation = Math.abs(this.conditions.ph - this.optimalPH);
    const phFactor = Math.exp(-(phDeviation ** 2) / 2);

    // CO2 limitation
    const co2Factor = Math.min(this.conditions.co2Level / 800, 1.0);

    // Nutrients
    const nutrientFactor = this.conditions.nutrientLevel;

    // Combined efficiency
    const efficiency =
      this.maxPhotosynthesisRate *
      lightFactor *
      tempFactor *
      phFactor *
      co2Factor *
      nutrientFactor;

    // Glucose production (grams/hour)
    const baseProduction = this.totalBiomass * 0.05; // 5% growth rate
    const glucoseProduction = baseProduction * efficiency;

    // Oxygen production (approximate stoichiometry)
    // 1 mole glucose produces 6 moles O2
    const oxygenProduction = (glucoseProduction / 180) * 6 * 32; // molar masses

    // Energy captured
    // Light energy = photon flux * photon energy
    const panelArea = 1.0; // m² default
    const incidentEnergy = (this.conditions.lightIntensity * panelArea * 3600) / 1000; // Joules
    const energyCaptured = incidentEnergy * efficiency;

    // Update biomass
    this.totalBiomass += glucoseProduction / 100; // Accumulate biomass

    // Deplete nutrients slightly
    this.conditions.nutrientLevel = Math.max(
      0,
      this.conditions.nutrientLevel - 0.001
    );

    return {
      glucoseProduction,
      oxygenProduction,
      energyCaptured,
      efficiency,
    };
  }

  /**
   * Harvests algae biomass
   */
  harvestBiomass(): number {
    const harvestAmount = this.totalBiomass * 0.5; // Harvest 50%
    this.totalBiomass *= 0.5;
    this.lastHarvest = new Date();
    return harvestAmount;
  }

  /**
   * Replenishes nutrients
   */
  addNutrients(amount: number): void {
    this.conditions.nutrientLevel = Math.min(
      1.0,
      this.conditions.nutrientLevel + amount
    );
  }

  /**
   * Gets panel status
   */
  getStatus(): {
    panelId: string;
    conditions: AlgaeConditions;
    biomass: number;
    lastHarvest: Date;
  } {
    return {
      panelId: this.panelId,
      conditions: { ...this.conditions },
      biomass: this.totalBiomass,
      lastHarvest: this.lastHarvest,
    };
  }
}
