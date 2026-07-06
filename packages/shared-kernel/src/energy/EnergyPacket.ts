/**
 * EnergyPacket - Core unit of energy exchange in CERBEA
 * Represents quantized energy with metadata and tracking
 */

export interface EnergyPacket {
  /** Unique identifier for this energy packet */
  id: string;

  /** Energy quantity in joules */
  joules: number;

  /** Quality metric (0-1) indicating purity and usability */
  quality: number;

  /** Source module (BER, TKRS, BESL, etc.) */
  source: string;

  /** Destination module or node */
  destination: string;

  /** Timestamp when energy was generated */
  generated: Date;

  /** Timestamp when energy was consumed or transferred */
  consumed?: Date;

  /** Stewardship tag for accountability */
  stewardshipTag?: string;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Creates a new energy packet
 */
export function createEnergyPacket(
  joules: number,
  source: string,
  destination: string,
  quality: number = 1.0
): EnergyPacket {
  return {
    id: `energy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    joules,
    quality,
    source,
    destination,
    generated: new Date(),
  };
}

/**
 * Validates energy packet integrity
 */
export function validateEnergyPacket(packet: EnergyPacket): boolean {
  return (
    packet.joules > 0 &&
    packet.quality >= 0 &&
    packet.quality <= 1 &&
    packet.source.length > 0 &&
    packet.destination.length > 0
  );
}

/**
 * Calculates usable energy after quality degradation
 */
export function getUsableEnergy(packet: EnergyPacket): number {
  return packet.joules * packet.quality;
}
