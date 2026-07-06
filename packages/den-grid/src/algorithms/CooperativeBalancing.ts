/**
 * CooperativeBalancing - Cooperative energy distribution algorithm
 * Implements consensus-based load balancing across grid nodes
 */

export interface GridNode {
  nodeId: string;
  currentLoad: number;
  capacity: number;
  demand: number;
}

export interface BalancingDecision {
  transfers: EnergyTransfer[];
  loadVariance: number;
  efficiency: number;
}

export interface EnergyTransfer {
  from: string;
  to: string;
  amount: number;
  priority: number;
}

/**
 * Cooperative Balancing Algorithm
 * Minimizes load variance across all nodes while respecting capacity constraints
 */
export class CooperativeBalancing {
  /**
   * Calculate optimal energy transfers for all nodes
   */
  static calculateTransfers(nodes: GridNode[]): BalancingDecision {
    const transfers: EnergyTransfer[] = [];
    let totalLoad = 0;
    let totalCapacity = 0;

    // Calculate totals
    for (const node of nodes) {
      totalLoad += node.currentLoad;
      totalCapacity += node.capacity;
    }

    // Target load per node
    const targetLoad = totalLoad / nodes.length;
    const targetLoadPerCapacity = totalCapacity > 0 ? totalLoad / totalCapacity : 0;

    // Identify overloaded and underloaded nodes
    const overloaded = nodes.filter((n) => n.currentLoad > targetLoad);
    const underloaded = nodes.filter((n) => n.currentLoad < targetLoad);

    // Create transfers from overloaded to underloaded
    for (const source of overloaded) {
      const excess = source.currentLoad - targetLoad;
      if (excess <= 0) continue;

      let remaining = excess;

      for (const dest of underloaded) {
        if (remaining <= 0) break;

        const deficit = targetLoad - dest.currentLoad;
        if (deficit <= 0) continue;

        const transfer = Math.min(remaining, deficit);
        const availableSpace = dest.capacity - dest.currentLoad;

        if (availableSpace > 0) {
          const actual = Math.min(transfer, availableSpace);

          transfers.push({
            from: source.nodeId,
            to: dest.nodeId,
            amount: actual,
            priority: 1,
          });

          remaining -= actual;
          dest.currentLoad += actual;
        }
      }

      source.currentLoad -= (excess - remaining);
    }

    // Calculate load variance (lower is better)
    const avgLoad = totalLoad / nodes.length;
    const variance = nodes.reduce((sum, node) => {
      return sum + Math.pow(node.currentLoad - avgLoad, 2);
    }, 0) / nodes.length;

    // Calculate efficiency (0-1, higher is better)
    const efficiency = Math.max(
      0,
      1 - Math.sqrt(variance) / avgLoad
    );

    return {
      transfers,
      loadVariance: variance,
      efficiency,
    };
  }

  /**
   * Validates that transfers don't violate constraints
   */
  static validateTransfers(transfers: EnergyTransfer[], nodes: GridNode[]): boolean {
    const nodeMap = new Map(nodes.map((n) => [n.nodeId, { ...n }]));

    for (const transfer of transfers) {
      const source = nodeMap.get(transfer.from);
      const dest = nodeMap.get(transfer.to);

      if (!source || !dest) return false;
      if (transfer.amount <= 0) return false;
      if (source.currentLoad < transfer.amount) return false; // Not enough to transfer
      if (dest.currentLoad + transfer.amount > dest.capacity) return false; // Would exceed capacity

      // Apply transfer
      source.currentLoad -= transfer.amount;
      dest.currentLoad += transfer.amount;
    }

    return true;
  }
}
