/**
 * FullSystemSim - Complete CERBEA system simulation
 * Simulates all modules working together in an integrated environment
 */

export interface SimulationConfig {
  duration: number; // ms
  tickInterval: number; // ms
  realtime: boolean; // If true, runs at real-time speed
}

export interface SimulationState {
  running: boolean;
  elapsed: number;
  tick: number;
  modules: ModuleSimState[];
}

export interface ModuleSimState {
  moduleId: string;
  status: 'initializing' | 'running' | 'paused' | 'error';
  energyGenerated: number;
  energyConsumed: number;
  efficiency: number;
}

export class FullSystemSim {
  private config: SimulationConfig;
  private state: SimulationState;
  private tickTimer?: NodeJS.Timeout;
  private startTime: number = 0;

  constructor(config: Partial<SimulationConfig> = {}) {
    this.config = {
      duration: 60000, // 1 minute
      tickInterval: 100, // 100ms
      realtime: false,
      ...config,
    };

    this.state = {
      running: false,
      elapsed: 0,
      tick: 0,
      modules: [
        { moduleId: 'ber-core', status: 'initializing', energyGenerated: 0, energyConsumed: 0, efficiency: 0 },
        { moduleId: 'tkrs-recovery', status: 'initializing', energyGenerated: 0, energyConsumed: 0, efficiency: 0 },
        { moduleId: 'den-grid', status: 'initializing', energyGenerated: 0, energyConsumed: 0, efficiency: 0 },
        { moduleId: 'men-forge', status: 'initializing', energyGenerated: 0, energyConsumed: 0, efficiency: 0 },
        { moduleId: 'besl-bio', status: 'initializing', energyGenerated: 0, energyConsumed: 0, efficiency: 0 },
        { moduleId: 'geo-oversight', status: 'initializing', energyGenerated: 0, energyConsumed: 0, efficiency: 0 },
      ],
    };
  }

  /**
   * Start simulation
   */
  async start(): Promise<void> {
    if (this.state.running) {
      console.warn('[SIM] Simulation already running');
      return;
    }

    this.state.running = true;
    this.startTime = Date.now();
    this.state.elapsed = 0;
    this.state.tick = 0;

    console.log('[SIM] Starting full system simulation');
    this.printHeader();

    this.tickTimer = setInterval(() => this.tick(), this.config.tickInterval);
  }

  /**
   * Stop simulation
   */
  async stop(): Promise<void> {
    if (!this.state.running) {
      return;
    }

    this.state.running = false;

    if (this.tickTimer) {
      clearInterval(this.tickTimer);
    }

    this.printSummary();
    console.log('[SIM] Simulation stopped');
  }

  /**
   * Single simulation tick
   */
  private tick(): void {
    this.state.elapsed = Date.now() - this.startTime;
    this.state.tick++;

    // Update each module
    for (const module of this.state.modules) {
      this.updateModule(module);
    }

    // Print progress every 10 ticks
    if (this.state.tick % 10 === 0) {
      this.printProgress();
    }

    // Check if simulation should end
    if (this.state.elapsed >= this.config.duration) {
      this.stop();
    }
  }

  /**
   * Updates a module state
   */
  private updateModule(module: ModuleSimState): void {
    if (module.status === 'initializing') {
      // Transition to running after a couple ticks
      if (this.state.tick > 2) {
        module.status = 'running';
      }
      return;
    }

    if (module.status !== 'running') {
      return;
    }

    // Simulate energy generation
    const baseGeneration = Math.random() * 1000 + 500; // 500-1500 J
    module.energyGenerated += baseGeneration;

    // Simulate energy consumption
    const baseConsumption = baseGeneration * (0.1 + Math.random() * 0.1); // 10-20% loss
    module.energyConsumed += baseConsumption;

    // Calculate efficiency
    module.efficiency = (module.energyGenerated - module.energyConsumed) / module.energyGenerated;
  }

  private printHeader(): void {
    console.log('═'.repeat(80));
    console.log('CERBEA FULL SYSTEM SIMULATION');
    console.log(`Duration: ${(this.config.duration / 1000).toFixed(1)}s | Tick: ${this.config.tickInterval}ms`);
    console.log('═'.repeat(80));
  }

  private printProgress(): void {
    const percent = (this.state.elapsed / this.config.duration * 100).toFixed(1);
    const totalEnergy = this.state.modules.reduce((sum, m) => sum + m.energyGenerated, 0);
    const totalConsumption = this.state.modules.reduce((sum, m) => sum + m.energyConsumed, 0);

    console.log(`[${percent}%] Tick ${this.state.tick} | Generated: ${totalEnergy.toFixed(0)}J | Consumed: ${totalConsumption.toFixed(0)}J`);
  }

  private printSummary(): void {
    const totalGenerated = this.state.modules.reduce((sum, m) => sum + m.energyGenerated, 0);
    const totalConsumed = this.state.modules.reduce((sum, m) => sum + m.energyConsumed, 0);
    const netEnergy = totalGenerated - totalConsumed;
    const totalEfficiency = netEnergy / totalGenerated;

    console.log('═'.repeat(80));
    console.log('SIMULATION RESULTS');
    console.log('─'.repeat(80));
    console.log(`Total Energy Generated: ${totalGenerated.toFixed(0)} J`);
    console.log(`Total Energy Consumed:  ${totalConsumed.toFixed(0)} J`);
    console.log(`Net Energy:             ${netEnergy.toFixed(0)} J`);
    console.log(`System Efficiency:      ${(totalEfficiency * 100).toFixed(1)}%`);
    console.log('─'.repeat(80));
    console.log('Module Summary:');

    for (const module of this.state.modules) {
      console.log(
        `  ${module.moduleId.padEnd(20)} | Generated: ${module.energyGenerated.toFixed(0).padStart(8)}J | Efficiency: ${(module.efficiency * 100).toFixed(1)}%`
      );
    }

    console.log('═'.repeat(80));
  }

  /**
   * Gets current simulation state
   */
  getState(): SimulationState {
    return { ...this.state };
  }
}
