/**
 * TEGArray - Thermoelectric Generator Array
 * Converts thermal gradients into electrical energy using Seebeck effect
 */

export interface TEGModule {
  id: string;
  hotSide: number; // °C
  coldSide: number; // °C
  voltage: number; // Volts
  current: number; // Amperes
  power: number; // Watts
  efficiency: number; // 0-1
}

export interface TEGArrayStatus {
  modules: TEGModule[];
  totalPower: number;
  averageEfficiency: number;
  operatingTemperature: number;
}

export class TEGArray {
  private modules: Map<string, TEGModule> = new Map();
  private seebeckCoefficient: number = 0.00022; // V/K for typical TEG materials
  private moduleResistance: number = 1.2; // Ohms

  constructor(moduleCount: number = 16) {
    this.initializeModules(moduleCount);
  }

  private initializeModules(count: number): void {
    for (let i = 0; i < count; i++) {
      const module: TEGModule = {
        id: `teg-${i}`,
        hotSide: 300, // Room temp
        coldSide: 300,
        voltage: 0,
        current: 0,
        power: 0,
        efficiency: 0,
      };
      this.modules.set(module.id, module);
    }
  }

  /**
   * Updates TEG conditions with new thermal data
   */
  updateThermalConditions(hotTemp: number, coldTemp: number): void {
    const temperatureDifference = hotTemp - coldTemp;

    for (const module of this.modules.values()) {
      module.hotSide = hotTemp;
      module.coldSide = coldTemp;

      // Calculate Seebeck voltage
      module.voltage = this.seebeckCoefficient * temperatureDifference;

      // Calculate current (Ohm's law)
      module.current = Math.max(0, module.voltage / this.moduleResistance);

      // Calculate power
      module.power = module.voltage * module.current;

      // Carnot efficiency upper limit
      const carnotEfficiency = temperatureDifference / hotTemp;
      // Typical TEG efficiency is 5-8% of Carnot limit
      module.efficiency = carnotEfficiency * 0.06;
    }
  }

  /**
   * Gets total power generation
   */
  getTotalPower(): number {
    let total = 0;
    for (const module of this.modules.values()) {
      total += module.power;
    }
    return total;
  }

  /**
   * Gets array status
   */
  getStatus(): TEGArrayStatus {
    const modules = Array.from(this.modules.values());
    let totalPower = 0;
    let totalEfficiency = 0;
    let avgTemp = 0;

    for (const module of modules) {
      totalPower += module.power;
      totalEfficiency += module.efficiency;
      avgTemp += (module.hotSide + module.coldSide) / 2;
    }

    return {
      modules,
      totalPower,
      averageEfficiency: totalEfficiency / modules.length,
      operatingTemperature: avgTemp / modules.length,
    };
  }
}
