/**
 * FullSystemSim - Complete CERBEA system simulation
 * Simulates all modules working together in an integrated environment
 * Enhanced with forge thermal monitoring and risk assessment
 */

import { ThermalOutput } from '../../packages/men-forge/src/smelting/ThermalOutput';
import { ThermalAnalytics } from '../../services/forge-link/src/ThermalAnalytics';
import { RiskMonitor } from '../../packages/geo-oversight/src/ethics/RiskMonitor';

export interface SimulationConfig {
  duration: number; // ms
  tickInterval: number; // ms
  realtime: boolean; // If true, runs at real-time speed
  enableForgeSimulation?: boolean; // Enable forge thermal monitoring
  enableRiskAssessment?: boolean; // Enable risk monitoring
}

export interface SimulationState {
  running: boolean;
  elapsed: number;
  tick: number;
  modules: ModuleSimState[];
  forgeActive: boolean;
  riskLevel: number;
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

  // Forge integration
  private thermalOutput: ThermalOutput | null = null;
  private thermalAnalytics: ThermalAnalytics | null = null;
  private riskMonitor: RiskMonitor | null = null;
  private forgeSimEnabled: boolean = false;
  private riskAssessmentEnabled: boolean = false;
  private currentForgeId: string = 'forge-primary';
  private forgeCycleCounter: number = 0;

  constructor(config: Partial<SimulationConfig> = {}) {
    this.config = {
      duration: 60000, // 1 minute
      tickInterval: 100, // 100ms
      realtime: false,
      enableForgeSimulation: true,
      enableRiskAssessment: true,
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
      forgeActive: false,
      riskLevel: 0,
    };

    // Initialize forge simulation if enabled
    if (this.config.enableForgeSimulation) {
      this.thermalOutput = new ThermalOutput(0.94); // 94% target efficiency
      this.thermalAnalytics = new ThermalAnalytics();
      this.forgeSimEnabled = true;
    }

    // Initialize risk monitoring if enabled
    if (this.config.enableRiskAssessment) {
      this.riskMonitor = new RiskMonitor();
      this.riskAssessmentEnabled = true;
    }
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
    this.forgeCycleCounter = 0;

    console.log('[SIM] Starting full system simulation');
    if (this.forgeSimEnabled) {
      console.log('[SIM] ✓ Forge thermal monitoring enabled');
    }
    if (this.riskAssessmentEnabled) {
      console.log('[SIM] ✓ Risk assessment monitoring enabled');
    }
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

    // Run forge thermal cycle every 5 ticks
    if (this.forgeSimEnabled && this.state.tick % 5 === 0) {
      this.runForgeCycle();
    }

    // Perform risk assessment every 10 ticks
    if (this.riskAssessmentEnabled && this.state.tick % 10 === 0) {
      this.performRiskAssessment();
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

  /**
   * Runs a forge thermal cycle
   */
  private runForgeCycle(): void {
    if (!this.thermalOutput || !this.thermalAnalytics) return;

    // Simulate smelting energy input (1000-2000 J)
    const smeltEnergy = Math.random() * 1000 + 1000;
    this.forgeCycleCounter++;

    // Generate thermal event
    const event = this.thermalOutput.generateThermalEvent(
      this.currentForgeId,
      this.forgeCycleCounter,
      smeltEnergy
    );

    // Record analytics
    this.thermalAnalytics.record(event);

    // Transfer recovered energy to grid module
    const forgeModule = this.state.modules.find(m => m.moduleId === 'men-forge');
    if (forgeModule) {
      forgeModule.energyGenerated += event.recoveredJoules;
    }

    this.state.forgeActive = true;

    if (this.state.tick % 20 === 0) {
      const summary = this.thermalAnalytics.getSummary();
      console.log(
        `[FORGE] Cycle ${this.forgeCycleCounter} | Recovery: ${(summary.recoveryRate * 100).toFixed(1)}% | Raw: ${summary.totalRaw.toFixed(0)}J | Recovered: ${summary.totalRecovered.toFixed(0)}J`
      );
    }
  }

  /**
   * Performs comprehensive risk assessment
   */
  private performRiskAssessment(): void {
    if (!this.riskMonitor || !this.thermalAnalytics) return;

    // Get thermal summary and check forge thermal surplus
    const thermalSummary = this.thermalAnalytics.getSummary();
    const thermalCheck = this.riskMonitor.checkForgeThermalSurplus(thermalSummary);

    // Update risk metrics based on thermal status
    if (thermalCheck.level === 'critical') {
      this.riskMonitor.updateMetric('forge-thermal-recovery', 0.95);
      this.state.riskLevel = 0.95;
    } else if (thermalCheck.level === 'warning') {
      this.riskMonitor.updateMetric('forge-thermal-recovery', 0.7);
      this.state.riskLevel = 0.7;
    } else {
      this.riskMonitor.updateMetric('forge-thermal-recovery', 0.1);
      this.state.riskLevel = 0.1;
    }

    // Perform full risk assessment
    const assessment = this.riskMonitor.assessRisk();
    this.state.riskLevel = assessment.overallRisk;

    if (this.state.tick % 30 === 0) {
      console.log(
        `[RISK] Overall: ${(assessment.overallRisk * 100).toFixed(1)}% | Thermal: ${thermalCheck.level.toUpperCase()} | Steward Review: ${assessment.requiresStewardReview ? 'YES' : 'NO'}`
      );
    }
  }

  private printHeader(): void {
    console.log('═'.repeat(100));
    console.log('CERBEA FULL SYSTEM SIMULATION');
    console.log(`Duration: ${(this.config.duration / 1000).toFixed(1)}s | Tick: ${this.config.tickInterval}ms`);
    console.log('═'.repeat(100));
  }

  private printProgress(): void {
    const percent = (this.state.elapsed / this.config.duration * 100).toFixed(1);
    const totalEnergy = this.state.modules.reduce((sum, m) => sum + m.energyGenerated, 0);
    const totalConsumption = this.state.modules.reduce((sum, m) => sum + m.energyConsumed, 0);
    const riskIndicator = this.riskAssessmentEnabled ? ` | Risk: ${(this.state.riskLevel * 100).toFixed(1)}%` : '';

    console.log(
      `[${percent}%] Tick ${this.state.tick} | Generated: ${totalEnergy.toFixed(0)}J | Consumed: ${totalConsumption.toFixed(0)}J${riskIndicator}`
    );
  }

  private printSummary(): void {
    const totalGenerated = this.state.modules.reduce((sum, m) => sum + m.energyGenerated, 0);
    const totalConsumed = this.state.modules.reduce((sum, m) => sum + m.energyConsumed, 0);
    const netEnergy = totalGenerated - totalConsumed;
    const totalEfficiency = netEnergy / totalGenerated;

    console.log('═'.repeat(100));
    console.log('SIMULATION RESULTS');
    console.log('─'.repeat(100));
    console.log(`Total Energy Generated: ${totalGenerated.toFixed(0)} J`);
    console.log(`Total Energy Consumed:  ${totalConsumed.toFixed(0)} J`);
    console.log(`Net Energy:             ${netEnergy.toFixed(0)} J`);
    console.log(`System Efficiency:      ${(totalEfficiency * 100).toFixed(1)}%`);
    console.log('─'.repeat(100));
    console.log('Module Summary:');

    for (const module of this.state.modules) {
      console.log(
        `  ${module.moduleId.padEnd(20)} | Generated: ${module.energyGenerated.toFixed(0).padStart(8)}J | Efficiency: ${(module.efficiency * 100).toFixed(1)}%`
      );
    }

    // Print forge analytics if available
    if (this.thermalAnalytics) {
      const thermalSummary = this.thermalAnalytics.getSummary();
      console.log('─'.repeat(100));
      console.log('Forge Thermal Analytics:');
      console.log(`  Total Raw Energy:      ${thermalSummary.totalRaw.toFixed(0)} J`);
      console.log(`  Total Recovered:       ${thermalSummary.totalRecovered.toFixed(0)} J`);
      console.log(`  Total Lost:            ${thermalSummary.totalLost.toFixed(0)} J`);
      console.log(`  Average Recovery Rate: ${(thermalSummary.recoveryRate * 100).toFixed(1)}%`);
      console.log(`  Cycles Completed:      ${thermalSummary.cycleCount}`);
    }

    // Print risk assessment if available
    if (this.riskMonitor) {
      const latestAssessment = this.riskMonitor.getLatestAssessment();
      if (latestAssessment) {
        console.log('─'.repeat(100));
        console.log('Risk Assessment:');
        console.log(`  Overall Risk Level:     ${(latestAssessment.overallRisk * 100).toFixed(1)}%`);
        console.log(`  Steward Review Required: ${latestAssessment.requiresStewardReview ? 'YES' : 'NO'}`);
        if (latestAssessment.alerts.length > 0) {
          console.log(`  Active Alerts: ${latestAssessment.alerts.length}`);
          for (const alert of latestAssessment.alerts.slice(0, 5)) {
            console.log(`    ${alert}`);
          }
        }
      }
    }

    console.log('═'.repeat(100));
  }

  /**
   * Gets current simulation state
   */
  getState(): SimulationState {
    return { ...this.state };
  }

  /**
   * Gets thermal analytics if available
   */
  getThermalAnalytics() {
    return this.thermalAnalytics;
  }

  /**
   * Gets risk monitor if available
   */
  getRiskMonitor() {
    return this.riskMonitor;
  }
}
