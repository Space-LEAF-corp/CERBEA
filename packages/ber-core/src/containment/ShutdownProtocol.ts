/**
 * ShutdownProtocol - Emergency shutdown sequence for BER
 * Ensures safe deactivation of plasma confinement
 */

export interface ShutdownPhase {
  phase: number;
  name: string;
  duration: number; // milliseconds
  actions: string[];
  completed: boolean;
}

export interface ShutdownStatus {
  active: boolean;
  phase: number;
  progress: number; // 0-1
  elapsed: number; // milliseconds
}

export class ShutdownProtocol {
  private phases: ShutdownPhase[] = [];
  private status: ShutdownStatus;
  private timer: NodeJS.Timeout | null = null;
  private startTime: number = 0;

  constructor() {
    this.status = {
      active: false,
      phase: 0,
      progress: 0,
      elapsed: 0,
    };
    this.initializePhases();
  }

  private initializePhases(): void {
    this.phases = [
      {
        phase: 1,
        name: 'Plasma Cooldown',
        duration: 5000,
        actions: ['Reduce heating power', 'Increase cryogenic flow', 'Monitor temperature'],
        completed: false,
      },
      {
        phase: 2,
        name: 'Magnetic Field Ramp Down',
        duration: 10000,
        actions: ['Gradually reduce primary field', 'Maintain secondary/tertiary balance', 'Check stability'],
        completed: false,
      },
      {
        phase: 3,
        name: 'Redundancy Deactivation',
        duration: 5000,
        actions: ['Deactivate secondary layer', 'Deactivate tertiary layer', 'Verify safe state'],
        completed: false,
      },
      {
        phase: 4,
        name: 'Final Shutdown',
        duration: 2000,
        actions: ['Cut all power', 'Activate emergency brakes', 'Lock containment'],
        completed: false,
      },
    ];
  }

  /**
   * Initiates emergency shutdown sequence
   */
  initiateShutdown(): void {
    if (this.status.active) {
      console.warn('[SHUTDOWN] Shutdown already in progress');
      return;
    }

    console.error('[SHUTDOWN] EMERGENCY SHUTDOWN INITIATED');
    this.status.active = true;
    this.status.phase = 0;
    this.status.progress = 0;
    this.startTime = Date.now();

    // Reset phases
    for (const phase of this.phases) {
      phase.completed = false;
    }

    this.executePhases();
  }

  /**
   * Executes shutdown phases sequentially
   */
  private executePhases(): void {
    let totalDuration = 0;
    for (const phase of this.phases) {
      totalDuration += phase.duration;
    }

    this.timer = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      this.status.elapsed = elapsed;
      this.status.progress = Math.min(elapsed / totalDuration, 1.0);

      // Determine current phase
      let currentPhaseIndex = 0;
      let phaseStart = 0;
      for (let i = 0; i < this.phases.length; i++) {
        const phaseEnd = phaseStart + this.phases[i].duration;
        if (elapsed < phaseEnd) {
          currentPhaseIndex = i;
          break;
        }
        phaseStart = phaseEnd;
        currentPhaseIndex = i + 1;
      }

      if (currentPhaseIndex < this.phases.length) {
        const phase = this.phases[currentPhaseIndex];
        if (!phase.completed) {
          this.executePhaseActions(phase);
          phase.completed = true;
        }
        this.status.phase = phase.phase;
      } else {
        // Shutdown complete
        this.completeShutdown();
      }
    }, 100);
  }

  /**
   * Executes actions for a shutdown phase
   */
  private executePhaseActions(phase: ShutdownPhase): void {
    console.log(`[SHUTDOWN] Phase ${phase.phase}: ${phase.name}`);
    for (const action of phase.actions) {
      console.log(`  → ${action}`);
    }
  }

  /**
   * Completes shutdown sequence
   */
  private completeShutdown(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.status.active = false;
    this.status.progress = 1.0;
    console.log('[SHUTDOWN] Emergency shutdown complete - system safe');
  }

  /**
   * Gets shutdown status
   */
  getStatus(): ShutdownStatus {
    return { ...this.status };
  }

  /**
   * Gets phases
   */
  getPhases(): ShutdownPhase[] {
    return JSON.parse(JSON.stringify(this.phases));
  }

  /**
   * Cancels shutdown (if still in early phase)
   */
  cancelShutdown(): boolean {
    if (this.status.phase > 1) {
      console.error('[SHUTDOWN] Cannot cancel - already past recovery point');
      return false;
    }

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.status.active = false;
    this.initializePhases();
    console.log('[SHUTDOWN] Shutdown cancelled');
    return true;
  }
}
