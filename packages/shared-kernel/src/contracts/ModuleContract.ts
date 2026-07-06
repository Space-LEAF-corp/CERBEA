/**
 * ModuleContract - Interface contract for CERBEA modules
 * Defines the minimal interface that every module must implement
 */

export interface ModuleContract {
  /** Module identifier */
  moduleId: string;

  /** Module name */
  name: string;

  /** Module version */
  version: string;

  /** Current operational state */
  state: 'initialized' | 'running' | 'paused' | 'shutdown' | 'error';

  /** Initialize the module */
  initialize(): Promise<void>;

  /** Start module operations */
  start(): Promise<void>;

  /** Pause module operations */
  pause(): Promise<void>;

  /** Resume module operations */
  resume(): Promise<void>;

  /** Shutdown module gracefully */
  shutdown(): Promise<void>;

  /** Get module health status */
  getHealth(): Promise<ModuleHealth>;

  /** Get module metrics */
  getMetrics(): Promise<ModuleMetrics>;
}

export interface ModuleHealth {
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  uptime: number;
  lastCheck: Date;
  errors?: string[];
}

export interface ModuleMetrics {
  operationCount: number;
  successCount: number;
  failureCount: number;
  averageLatency: number;
  energyProcessed: number;
}

/**
 * Abstract base class implementing ModuleContract
 */
export abstract class BaseModule implements ModuleContract {
  moduleId: string;
  name: string;
  version: string;
  state: 'initialized' | 'running' | 'paused' | 'shutdown' | 'error' = 'initialized';

  protected metrics: ModuleMetrics = {
    operationCount: 0,
    successCount: 0,
    failureCount: 0,
    averageLatency: 0,
    energyProcessed: 0,
  };

  protected startTime: Date = new Date();

  constructor(moduleId: string, name: string, version: string = '1.0.0') {
    this.moduleId = moduleId;
    this.name = name;
    this.version = version;
  }

  async initialize(): Promise<void> {
    this.state = 'initialized';
  }

  async start(): Promise<void> {
    this.state = 'running';
    this.startTime = new Date();
  }

  async pause(): Promise<void> {
    this.state = 'paused';
  }

  async resume(): Promise<void> {
    this.state = 'running';
  }

  async shutdown(): Promise<void> {
    this.state = 'shutdown';
  }

  async getHealth(): Promise<ModuleHealth> {
    const uptime = Date.now() - this.startTime.getTime();
    return {
      status: this.state === 'running' ? 'healthy' : 'offline',
      uptime,
      lastCheck: new Date(),
    };
  }

  async getMetrics(): Promise<ModuleMetrics> {
    return this.metrics;
  }

  protected recordSuccess(latency: number, energyProcessed: number = 0): void {
    this.metrics.operationCount++;
    this.metrics.successCount++;
    this.metrics.averageLatency =
      (this.metrics.averageLatency * (this.metrics.operationCount - 1) + latency) /
      this.metrics.operationCount;
    this.metrics.energyProcessed += energyProcessed;
  }

  protected recordFailure(): void {
    this.metrics.operationCount++;
    this.metrics.failureCount++;
  }
}
