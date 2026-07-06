/**
 * ConfinementModel - Triple-redundant plasma magnetic confinement system
 * Manages magnetic field generation and plasma stability
 */

export interface ConfinementField {
  id: string;
  strength: number; // Tesla
  frequency: number; // Hz
  stability: number; // 0-1, stability metric
  active: boolean;
}

export interface PlasmaState {
  temperature: number; // Kelvin
  density: number; // particles per m^3
  pressure: number; // Pa
  volume: number; // m^3
  confinement: number; // 0-1, confinement quality metric
}

export class ConfinementModel {
  private primaryField: ConfinementField;
  private secondaryField: ConfinementField;
  private tertiaryField: ConfinementField;
  private plasmaState: PlasmaState;
  private targetTemperature: number = 1e7; // 10 million Kelvin

  constructor() {
    this.primaryField = this.createField('primary');
    this.secondaryField = this.createField('secondary');
    this.tertiaryField = this.createField('tertiary');
    this.plasmaState = this.initializePlasmaState();
  }

  private createField(id: string): ConfinementField {
    return {
      id,
      strength: 8.0, // Tesla
      frequency: 50, // Hz (adjustable)
      stability: 0.99,
      active: false,
    };
  }

  private initializePlasmaState(): PlasmaState {
    return {
      temperature: 1e6, // Starting at 1M Kelvin
      density: 1e20, // 10^20 particles/m^3
      pressure: 1e6, // Pa
      volume: 1, // m^3 (normalized)
      confinement: 0.95,
    };
  }

  /**
   * Energizes all three confinement fields
   */
  public activateConfinement(): boolean {
    this.primaryField.active = true;
    this.secondaryField.active = true;
    this.tertiaryField.active = true;

    return (
      this.primaryField.active && this.secondaryField.active && this.tertiaryField.active
    );
  }

  /**
   * Checks if confinement is maintained with redundancy
   */
  public isConfinementStable(): boolean {
    const activeFields = [this.primaryField, this.secondaryField, this.tertiaryField].filter(
      (f) => f.active
    ).length;

    // Need at least 2 out of 3 fields for stable confinement
    if (activeFields < 2) {
      return false;
    }

    return this.plasmaState.confinement > 0.85;
  }

  /**
   * Gradually increases plasma temperature toward target
   */
  public heatPlasma(energyInput: number): void {
    if (!this.isConfinementStable()) {
      console.warn('Confinement unstable, aborting heat increase');
      return;
    }

    // Temperature increase proportional to energy and current temperature
    const tempIncrease = (energyInput / this.plasmaState.density) * 1e3;
    this.plasmaState.temperature += tempIncrease;

    if (this.plasmaState.temperature > this.targetTemperature) {
      this.plasmaState.temperature = this.targetTemperature;
    }

    this.updateConfinementQuality();
  }

  /**
   * Updates confinement quality based on plasma state
   */
  private updateConfinementQuality(): void {
    // Temperature closer to target improves confinement
    const tempRatio = this.plasmaState.temperature / this.targetTemperature;
    const tempFactor = Math.min(tempRatio, 1.0);

    // Pressure and density also affect confinement
    const pressureFactor = Math.min(this.plasmaState.pressure / 1e6, 1.0);

    this.plasmaState.confinement = tempFactor * 0.6 + pressureFactor * 0.4;
  }

  /**
   * Gets current plasma state
   */
  public getPlasmaState(): PlasmaState {
    return { ...this.plasmaState };
  }

  /**
   * Checks field redundancy status
   */
  public getRedundancyStatus(): { primary: boolean; secondary: boolean; tertiary: boolean } {
    return {
      primary: this.primaryField.active,
      secondary: this.secondaryField.active,
      tertiary: this.tertiaryField.active,
    };
  }
}
