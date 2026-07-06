import { ThermalEvent } from "../../packages/men-forge/src/smelting/ThermalOutput";

export class ThermalAnalytics {
  private events: ThermalEvent[] = [];

  record(event: ThermalEvent) {
    this.events.push(event);
  }

  getSummary() {
    const totalRaw = this.events.reduce((s, e) => s + e.rawThermalJoules, 0);
    const totalRecovered = this.events.reduce((s, e) => s + e.recoveredJoules, 0);
    const totalLost = this.events.reduce((s, e) => s + e.lostJoules, 0);

    const recoveryRate = totalRaw > 0 ? totalRecovered / totalRaw : 0;

    return {
      totalRaw,
      totalRecovered,
      totalLost,
      recoveryRate,
      eventCount: this.events.length,
    };
  }

  getPerForge() {
    const byForge = new Map<string, ThermalEvent[]>();
    for (const e of this.events) {
      if (!byForge.has(e.forgeId)) byForge.set(e.forgeId, []);
      byForge.get(e.forgeId)!.push(e);
    }

    return Array.from(byForge.entries()).map(([forgeId, events]) => {
      const totalRaw = events.reduce((s, e) => s + e.rawThermalJoules, 0);
      const totalRecovered = events.reduce((s, e) => s + e.recoveredJoules, 0);
      const totalLost = events.reduce((s, e) => s + e.lostJoules, 0);
      const recoveryRate = totalRaw > 0 ? totalRecovered / totalRaw : 0;

      return { forgeId, totalRaw, totalRecovered, totalLost, recoveryRate };
    });
  }
}
