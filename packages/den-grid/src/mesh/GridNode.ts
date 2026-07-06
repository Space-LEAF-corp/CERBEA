/**
 * GridNode - Individual node in the DEN mesh
 * Manages energy storage, distribution, and node communication
 */

export interface NodeStatus {
  nodeId: string;
  online: boolean;
  load: number; // Watts
  capacity: number; // Watts max
  batteryLevel: number; // 0-1
  neighbors: string[]; // Connected node IDs
}

export interface EnergyPacketBuffer {
  id: string;
  source: string;
  destination: string;
  amount: number;
  timestamp: Date;
  priority: number;
}

export class GridNode {
  private nodeId: string;
  private online: boolean = false;
  private load: number = 0;
  private capacity: number = 1000; // 1kW default
  private batteryLevel: number = 1.0;
  private neighbors: Set<string> = new Set();
  private packetBuffer: EnergyPacketBuffer[] = [];
  private maxBufferSize: number = 100;

  constructor(nodeId: string, capacity: number = 1000) {
    this.nodeId = nodeId;
    this.capacity = capacity;
  }

  /**
   * Brings node online
   */
  online(): void {
    this.online = true;
    console.log(`[GRID-NODE] Node ${this.nodeId} came online`);
  }

  /**
   * Takes node offline
   */
  offline(): void {
    this.online = false;
    console.log(`[GRID-NODE] Node ${this.nodeId} went offline`);
  }

  /**
   * Registers neighbor node
   */
  registerNeighbor(nodeId: string): void {
    this.neighbors.add(nodeId);
  }

  /**
   * Removes neighbor
   */
  removeNeighbor(nodeId: string): void {
    this.neighbors.delete(nodeId);
  }

  /**
   * Receives energy packet
   */
  receivePacket(packet: EnergyPacketBuffer): boolean {
    if (!this.online) {
      return false;
    }

    if (this.packetBuffer.length >= this.maxBufferSize) {
      console.warn(`[GRID-NODE] Node ${this.nodeId} buffer full`);
      return false;
    }

    this.packetBuffer.push(packet);
    this.load += packet.amount;
    this.load = Math.min(this.load, this.capacity);
    this.batteryLevel = this.load / this.capacity;

    return true;
  }

  /**
   * Sends energy to neighbor
   */
  sendEnergy(destinationNodeId: string, amount: number): EnergyPacketBuffer | null {
    if (!this.online) {
      return null;
    }

    if (!this.neighbors.has(destinationNodeId)) {
      console.warn(`[GRID-NODE] Not connected to ${destinationNodeId}`);
      return null;
    }

    const available = Math.min(amount, this.load);
    if (available <= 0) {
      return null;
    }

    this.load -= available;
    this.batteryLevel = this.load / this.capacity;

    const packet: EnergyPacketBuffer = {
      id: `pkt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: this.nodeId,
      destination: destinationNodeId,
      amount: available,
      timestamp: new Date(),
      priority: 1,
    };

    return packet;
  }

  /**
   * Gets node status
   */
  getStatus(): NodeStatus {
    return {
      nodeId: this.nodeId,
      online: this.online,
      load: this.load,
      capacity: this.capacity,
      batteryLevel: this.batteryLevel,
      neighbors: Array.from(this.neighbors),
    };
  }

  /**
   * Gets buffer occupancy
   */
  getBufferLoad(): number {
    return this.packetBuffer.length / this.maxBufferSize;
  }
}
