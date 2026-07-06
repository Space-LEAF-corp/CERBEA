/**
 * FusionPathway - Manages fusion reaction pathways
 * Calculates energy output based on plasma conditions
 */

export interface FusionReaction {
  id: string;
  reactant1: string;
  reactant2: string;
  products: string[];
  energyOutput: number; // MeV
  crossSection: number; // barn (unit of area)
  temperature: number; // K required
}

export interface FusionState {
  activeReactions: FusionReaction[];
  totalReactionRate: number; // reactions/sec
  energyGenerated: number; // Joules
  efficiency: number; // 0-1
}

export class FusionPathway {
  private state: FusionState;
  private reactions: Map<string, FusionReaction> = new Map();

  constructor() {
    this.state = {
      activeReactions: [],
      totalReactionRate: 0,
      energyGenerated: 0,
      efficiency: 0.85,
    };
    this.initializeReactions();
  }

  private initializeReactions(): void {
    // D-T Fusion (most practical)
    const dtFusion: FusionReaction = {
      id: 'dt-fusion',
      reactant1: 'deuterium',
      reactant2: 'tritium',
      products: ['helium-4', 'neutron'],
      energyOutput: 17.6, // MeV
      crossSection: 5.0, // barn
      temperature: 1e7, // 10 million K
    };

    // D-D Fusion
    const ddFusion: FusionReaction = {
      id: 'dd-fusion',
      reactant1: 'deuterium',
      reactant2: 'deuterium',
      products: ['helium-3', 'neutron'],
      energyOutput: 3.27,
      crossSection: 0.1,
      temperature: 5e7,
    };

    this.reactions.set(dtFusion.id, dtFusion);
    this.reactions.set(ddFusion.id, ddFusion);
  }

  /**
   * Calculates fusion reaction rate given plasma conditions
   */
  calculateReactionRate(
    temperature: number,
    density: number,
    volume: number
  ): number {
    let totalRate = 0;

    for (const reaction of this.reactions.values()) {
      if (temperature < reaction.temperature * 0.8) {
        continue; // Temperature too low for this reaction
      }

      // Boltzmann factor for reaction probability
      const boltzmannFactor = Math.exp(-reaction.temperature / temperature);
      const reactionRate = density * density * volume * reaction.crossSection * boltzmannFactor;
      totalRate += reactionRate;
    }

    this.state.totalReactionRate = totalRate;
    return totalRate;
  }

  /**
   * Calculates energy output from fusion reactions
   */
  calculateEnergyOutput(reactionRate: number): number {
    let totalEnergy = 0;

    // Weight by active reaction cross-sections
    let totalCrossSection = 0;
    for (const reaction of this.reactions.values()) {
      totalCrossSection += reaction.crossSection;
      totalEnergy += (reactionRate / this.reactions.size) * reaction.energyOutput;
    }

    // Convert MeV to Joules (1 MeV = 1.602e-13 J)
    const energyJoules = totalEnergy * 1.602e-13;
    this.state.energyGenerated += energyJoules * this.state.efficiency;

    return energyJoules * this.state.efficiency;
  }

  /**
   * Gets current fusion state
   */
  getState(): FusionState {
    return { ...this.state };
  }

  /**
   * Gets available reactions
   */
  getReactions(): FusionReaction[] {
    return Array.from(this.reactions.values());
  }
}
