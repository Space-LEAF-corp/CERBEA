/**
 * Orchestrator - Central coordinator for all CERBEA modules
 * Manages module initialization, energy flow, and system-wide coordination
 * Integrates DEN-based cooperative balancing for energy distribution
 */

import { BaseModule, ModuleHealth, ModuleMetrics } from '../../packages/shared-kernel/src/contracts/ModuleContract';
import { balanceStep } from '../../packages/den-grid/src/algorithms/CooperativeBalancing';
import { GridNode } from '../../packages/den-grid/src/mesh/GridNode';

export interface OrchestratorConfig {
  maxConcurrentModules: number;
  energyDistributionInterval: number; // ms
  healthCheckInterval: number; // ms
  emergencyThreshold: number; // 0-1
}

export class Orchestrator {
  private modules: Map<string, BaseModule> = new Map();
  private gridNodes: Map<string, GridNode> = new Map();
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
   * Registers a module with the orchestrator and creates a corresponding GridNode
   */
  async registerModule(module: BaseModule): Promise<void> {
    if (this.modules.size >= this.config.maxConcurrentModules) {
      throw new Error(`Maximum concurrent modules (${this.config.maxConcurrentModules}) reached`);
    }

    this.modules.set(module.moduleId, module);
    
    // Create a GridNode for this module to participate in DEN balancing
    const gridNode = new GridNode(module.moduleId, 100); // capacity = 100 energy units
    this.gridNodes.set(module.moduleId, gridNode);
    
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

    // Connect grid nodes as neighbors (mesh topology)
    this.connectGridNodes();

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

  /**
   * Connects grid nodes to form a mesh topology for DEN balancing
   */
  private connectGridNodes(): void {
    const nodeArray = Array.from(this.gridNodes.values());
    
    // Simple topology: each node connects to the next two neighbors (circular)
    for (let i = 0; i < nodeArray.length; i++) {
      const node = nodeArray[i];
      node.neighbors = [
        nodeArray[(i + 1) % nodeArray.length],
        nodeArray[(i + 2) % nodeArray.length],
      ];
    }
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

  /**
   * Runs DEN-based cooperative balancing and applies energy flows
   */
  private startEnergyDistributionLoop(): void {
    this.energyDistributionTimer = setInterval(() => {
      this.runDENBalancing();
    }, this.config.energyDistributionInterval);
  }

  /**
   * Execute one round of DEN cooperative balancing
   */
  private runDENBalancing(): void {
    const nodes = Array.from(this.gridNodes.values());

    // Step 1: Gather neighbor state advertisements
    const advertised = new Map<string, { id: string; load: number }>();
    for (const node of nodes) {
      advertised.set(node.id, node.advertiseState());
    }

    // Step 2: Run balancing for each node
    const flowIntents = [];
    for (const node of nodes) {
      const neighborStates = node.neighbors.map(n => advertised.get(n.id)!);
      const intent = balanceStep(node, neighborStates);
      if (intent) flowIntents.push(intent);
    }

    // Step 3: Apply flows to modules
    this.applyEnergyFlows(flowIntents);
  }

  /**
   * Apply computed energy flows between modules
   */
  private applyEnergyFlows(flowIntents: any[]): void {
    for (const intent of flowIntents) {
      const node = this.gridNodes.get(intent.fromNode);
      if (!node) continue;

      const load = node.getLoad();

      // Surplus case: send energy out to neighbors
      if (load < 0) {
        const surplus = Math.abs(load) * node.capacity;
        for (const flow of intent.flows) {
          if (flow.fraction > 0) {
            const amount = surplus * flow.fraction;
            this.transferEnergy(node.id, flow.id, amount);
          }
        }
      }

      // Deficit case: request energy in from neighbors
      if (load > 0) {
        const deficit = load * node.capacity;
        for (const flow of intent.flows) {
          if (flow.fraction > 0) {
            const amount = deficit * flow.fraction;
            this.transferEnergy(flow.id, node.id, amount);
          }
        }
      }
    }
  }

  /**
   * Transfer energy between two modules
   */
  private transferEnergy(fromModuleId: string, toModuleId: string, amount: number): void {
    const fromNode = this.gridNodes.get(fromModuleId);
    const toNode = this.gridNodes.get(toModuleId);

    if (!fromNode || !toNode) return;

    // Adjust local supply/demand to reflect the transfer
    fromNode.localSupply += amount;
    toNode.localDemand -= amount;

    console.log(
      `[ENERGY] Transferred ${amount.toFixed(2)} units from ${fromModuleId} to ${toModuleId}`
    );
  }

  /**
   * Gets registered modules
   */
  getModules(): Map<string, BaseModule> {
    return new Map(this.modules);
  }

  /**
   * Gets grid nodes (for monitoring/debugging)
   */
  getGridNodes(): Map<string, GridNode> {
    return new Map(this.gridNodes);
  }

  /**
   * Checks if orchestrator is running
   */
  isRunning(): boolean {
    return this.running;
  }
}
