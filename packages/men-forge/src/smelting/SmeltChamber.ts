/**
 * SmeltChamber - Thermal smelting chamber for materials processing
 * Melts and processes collected debris
 */

export interface SmeltingBatch {
  id: string;
  materialType: string; // aluminum, steel, copper, etc.
  weight: number; // kg
  temperature: number; // °C
  status: 'loading' | 'heating' | 'melting' | 'cooling' | 'complete';
  timeElapsed: number; // seconds
  purity: number; // 0-1
}

export interface ChamberStatus {
  temperature: number;
  currentBatch?: SmeltingBatch;
  batchesProcessed: number;
  efficiency: number;
}

export class SmeltChamber {
  private temperature: number = 20; // °C ambient
  private currentBatch?: SmeltingBatch;
  private batchesProcessed: number = 0;
  private heatingPower: number = 50000; // 50kW
  private efficiency: number = 0.92; // 92% thermal efficiency
  private operatingTimer?: NodeJS.Timeout;

  // Melting points in Celsius
  private meltingPoints: Record<string, number> = {
    aluminum: 660,
    copper: 1085,
    steel: 1425,
    titanium: 1668,
    gold: 1064,
  };

  /**
   * Loads material into chamber
   */
  loadMaterial(materialType: string, weight: number): SmeltingBatch {
    if (this.currentBatch) {
      throw new Error('Chamber already contains a batch');
    }

    const batch: SmeltingBatch = {
      id: `batch-${Date.now()}`,
      materialType,
      weight,
      temperature: this.temperature,
      status: 'loading',
      timeElapsed: 0,
      purity: 0.85, // Initial purity from collected debris
    };

    this.currentBatch = batch;
    console.log(`[SMELT] Loaded ${weight}kg of ${materialType}`);
    return batch;
  }

  /**
   * Starts smelting process
   */
  startSmelting(): void {
    if (!this.currentBatch) {
      throw new Error('No batch loaded');
    }

    const batch = this.currentBatch;
    const meltTemp = this.meltingPoints[batch.materialType];

    if (!meltTemp) {
      throw new Error(`Unknown material type: ${batch.materialType}`);
    }

    batch.status = 'heating';
    console.log(`[SMELT] Starting smelting of ${batch.materialType}`);

    this.operatingTimer = setInterval(() => {
      this.processSmelt(batch, meltTemp);
    }, 1000);
  }

  /**
   * Process smelting simulation
   */
  private processSmelt(batch: SmeltingBatch, meltTemp: number): void {
    batch.timeElapsed++;

    // Heat chamber
    const tempDifference = meltTemp - this.temperature;
    const heatRate = (this.heatingPower * this.efficiency) / (batch.weight * 500); // Assume specific heat ~500 J/kg°C
    this.temperature += heatRate;

    batch.temperature = this.temperature;

    // Update batch status
    if (this.temperature < meltTemp * 0.7) {
      batch.status = 'heating';
    } else if (this.temperature < meltTemp) {
      batch.status = 'heating';
    } else {
      batch.status = 'melting';
      // Improve purity during smelting
      batch.purity = Math.min(1.0, batch.purity + 0.001);
    }

    // Complete smelting after sufficient time and temperature
    if (batch.temperature >= meltTemp && batch.timeElapsed > 60) {
      this.completeSmelting();
    }
  }

  /**
   * Completes smelting and begins cooling
   */
  private completeSmelting(): void {
    if (!this.currentBatch || !this.operatingTimer) return;

    clearInterval(this.operatingTimer);
    this.operatingTimer = undefined;

    const batch = this.currentBatch;
    batch.status = 'cooling';
    this.temperature -= 5; // Begin cooling

    console.log(`[SMELT] Smelting complete. Purity: ${(batch.purity * 100).toFixed(1)}%`);

    // Complete after cooling
    setTimeout(() => {
      batch.status = 'complete';
      this.temperature = 20;
      this.batchesProcessed++;
      console.log(`[SMELT] Batch ${batch.id} ready for processing`);
    }, 5000);
  }

  /**
   * Unloads completed batch
   */
  unloadBatch(): SmeltingBatch | null {
    if (!this.currentBatch) return null;

    const batch = this.currentBatch;
    this.currentBatch = undefined;
    return batch;
  }

  /**
   * Gets chamber status
   */
  getStatus(): ChamberStatus {
    return {
      temperature: this.temperature,
      currentBatch: this.currentBatch,
      batchesProcessed: this.batchesProcessed,
      efficiency: this.efficiency,
    };
  }
}
