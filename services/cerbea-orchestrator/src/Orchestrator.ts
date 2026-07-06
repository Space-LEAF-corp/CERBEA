/**
 * Orchestrator - Central coordinator for all CERBEA modules
 * Manages module initialization, energy flow, and system-wide coordination
 */

import { BaseModule, ModuleHealth, ModuleMetrics } from '../../packages/shared-kernel/src/contracts/ModuleContract';

export interface OrchestratorConfig {
  maxConcurrentModules: number;
  energyDistributionInterval: number; // ms
  healthCheckInterval: number; // ms
  emergencyThreshold: number; // 0-1
}

export class Orchestrator {
  private modules: Map<string, BaseModule> = new Map();
  private config: OrchestratorConfig;
  private running: boolean = false;
  private healthCheckTimer?: NodeJS.Timeout;
  private energyDistributionTimer?: NodeJS.Timeout;

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = {
      maxConcurrentModules: 16,
      energyDistributionInterval: 1000,
      healthCheckInterval: 5000,
      emergencyThreshold: 0.9,
      ...config,
    };
  }

  /**
   * Registers a module with the orchestrator
   */
  async registerModule(module: BaseModule): Promise<void> {
    if (this.modules.size >= this.config.maxConcurrentModules) {
      throw new Error(`Maximum concurrent modules (${this.config.maxConcurrentModules}) reached`);
    }

    this.modules.set(module.moduleId, module);
    await module.initialize();
    console.log(`[ORCHESTRATOR] Registered module: ${module.moduleId}`);
  }

  /**
   * Starts the orchestrator and all registered modules
   */
  async start(): Promise<void> {
    if (this.running) {
      console.warn('[ORCHESTRATOR] Already running');
      return;
    }

    this.running = true;

    // Start all modules
    for (const [moduleId, module] of this.modules) {
      try {
        await module.start();
        console.log(`[ORCHESTRATOR] Started module: ${moduleId}`);
      } catch (error) {
        console.error(`[ORCHESTRATOR] Failed to start module ${moduleId}:`, error);
      }
    }

    // Start background tasks
    this.startHealthCheckLoop();
    this.startEnergyDistributionLoop();

    console.log('[ORCHESTRATOR] System started');
  }

  /**
   * Stops the orchestrator and all modules
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.running = false;

    // Stop background tasks
    if (this.healthCheckTimer) clearInterval(this.healthCheckTimer);
    if (this.energyDistributionTimer) clearInterval(this.energyDistributionTimer);

    // Stop all modules
    for (const [moduleId, module] of this.modules) {
      try {
        await module.shutdown();
        console.log(`[ORCHESTRATOR] Shutdown module: ${moduleId}`);
      } catch (error) {
        console.error(`[ORCHESTRATOR] Error shutting down module ${moduleId}:`, error);
      }
    }

    console.log('[ORCHESTRATOR] System stopped');
  }

  /**
   * Gets system health status
   */
  async getSystemHealth(): Promise<Map<string, ModuleHealth>> {
    const health = new Map<string, ModuleHealth>();

    for (const [moduleId, module] of this.modules) {
      try {
        const moduleHealth = await module.getHealth();
        health.set(moduleId, moduleHealth);
      } catch (error) {
        health.set(moduleId, {
          status: 'offline',
          uptime: 0,
          lastCheck: new Date(),
          errors: [`${error}`],
        });
      }
    }

    return health;
  }

  /**
   * Gets system metrics
   */
  async getSystemMetrics(): Promise<Map<string, ModuleMetrics>> {
    const metrics = new Map<string, ModuleMetrics>();

    for (const [moduleId, module] of this.modules) {
      try {
        const moduleMetrics = await module.getMetrics();
        metrics.set(moduleId, moduleMetrics);
      } catch (error) {
        console.error(`Error getting metrics for ${moduleId}:`, error);
      }
    }

    return metrics;
  }

  private startHealthCheckLoop(): void {
    this.healthCheckTimer = setInterval(async () => {
      const health = await this.getSystemHealth();
      let criticalCount = 0;

      for (const [moduleId, status] of health) {
        if (status.status === 'critical') {
          criticalCount++;
          console.warn(`[HEALTH] Module ${moduleId} is in CRITICAL state`);
        }
      }

      if (criticalCount > this.config.maxConcurrentModules * 0.5) {
        console.error('[HEALTH] System health critical - multiple modules failing');
        // TODO: Trigger emergency procedures
      }
    }, this.config.healthCheckInterval);
  }

  private startEnergyDistributionLoop(): void {
    this.energyDistributionTimer = setInterval(() => {
      // Energy distribution logic would go here
      // Coordinate energy flow between modules
    }, this.config.energyDistributionInterval);
  }

  /**
   * Gets registered modules
   */
  getModules(): Map<string, BaseModule> {
    return new Map(this.modules);
  }

  /**
   * Checks if orchestrator is running
   */
  isRunning(): boolean {
    return this.running;
  }
}
