/**
 * MassDefectCalculator - Calculates energy from mass defect (E=mc²)
 * Leverages Einstein's mass-energy equivalence
 */

export interface Nucleus {
  id: string;
  name: string;
  protons: number;
  neutrons: number;
  atomicMass: number; // u (atomic mass units)
}

export interface MassDefect {
  nucleus: Nucleus;
  defect: number; // u
  energyPerNucleon: number; // MeV/nucleon
  bindingEnergy: number; // MeV
}

export class MassDefectCalculator {
  private readonly PROTON_MASS = 1.007276; // u
  private readonly NEUTRON_MASS = 1.008665; // u
  private readonly ELECTRON_MASS = 0.000549; // u
  private readonly MEV_PER_U = 931.494; // MeV/u (conversion factor)

  private nuclei: Map<string, Nucleus> = new Map();

  constructor() {
    this.initializeNuclei();
  }

  private initializeNuclei(): void {
    // Common fusion product nuclei
    const helium4: Nucleus = {
      id: 'he-4',
      name: 'Helium-4',
      protons: 2,
      neutrons: 2,
      atomicMass: 4.002603,
    };

    const deuterium: Nucleus = {
      id: 'h-2',
      name: 'Deuterium',
      protons: 1,
      neutrons: 1,
      atomicMass: 2.014102,
    };

    const tritium: Nucleus = {
      id: 'h-3',
      name: 'Tritium',
      protons: 1,
      neutrons: 2,
      atomicMass: 3.016049,
    };

    this.nuclei.set(helium4.id, helium4);
    this.nuclei.set(deuterium.id, deuterium);
    this.nuclei.set(tritium.id, tritium);
  }

  /**
   * Calculates mass defect for a nucleus
   */
  calculateMassDefect(nucleusId: string): MassDefect | null {
    const nucleus = this.nuclei.get(nucleusId);
    if (!nucleus) {
      return null;
    }

    // Calculate expected mass from constituent particles
    const expectedMass =
      nucleus.protons * this.PROTON_MASS +
      nucleus.neutrons * this.NEUTRON_MASS -
      nucleus.protons * this.ELECTRON_MASS; // Account for electrons in atom

    // Mass defect
    const defect = expectedMass - nucleus.atomicMass;

    // Convert to binding energy
    const bindingEnergy = defect * this.MEV_PER_U;
    const nucleonCount = nucleus.protons + nucleus.neutrons;
    const energyPerNucleon = bindingEnergy / nucleonCount;

    return {
      nucleus,
      defect,
      energyPerNucleon,
      bindingEnergy,
    };
  }

  /**
   * Calculates energy released in a reaction
   */
  calculateReactionEnergy(
    reactants: string[],
    products: string[]
  ): number {
    let reactantEnergy = 0;
    let productEnergy = 0;

    for (const id of reactants) {
      const defect = this.calculateMassDefect(id);
      if (defect) {
        reactantEnergy += defect.bindingEnergy;
      }
    }

    for (const id of products) {
      const defect = this.calculateMassDefect(id);
      if (defect) {
        productEnergy += defect.bindingEnergy;
      }
    }

    // Energy released is difference in binding energy
    return Math.abs(productEnergy - reactantEnergy);
  }

  /**
   * Gets nucleus data
   */
  getNucleus(id: string): Nucleus | null {
    return this.nuclei.get(id) || null;
  }
}
