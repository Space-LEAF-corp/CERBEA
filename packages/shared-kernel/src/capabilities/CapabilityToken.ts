/**
 * CapabilityToken - Authorization and capability management
 * Enables fine-grained permission control across CERBEA modules
 */

export interface CapabilityToken {
  /** Unique token identifier */
  id: string;

  /** Entity that holds this capability */
  holder: string;

  /** Capability name (e.g., 'modify-energy-flow', 'override-safety') */
  capability: string;

  /** Scope of capability (local, grid, system-wide) */
  scope: 'local' | 'grid' | 'system';

  /** Issue timestamp */
  issuedAt: Date;

  /** Expiration timestamp */
  expiresAt: Date;

  /** Is this capability currently active */
  active: boolean;

  /** Optional constraints on capability use */
  constraints?: string[];

  /** Audit trail */
  auditLog?: string[];
}

/**
 * Creates a new capability token
 */
export function createCapabilityToken(
  holder: string,
  capability: string,
  scope: 'local' | 'grid' | 'system' = 'local',
  durationHours: number = 24
): CapabilityToken {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

  return {
    id: `cap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    holder,
    capability,
    scope,
    issuedAt: now,
    expiresAt,
    active: true,
  };
}

/**
 * Checks if a capability token is still valid
 */
export function isCapabilityValid(token: CapabilityToken): boolean {
  return token.active && new Date() < token.expiresAt;
}

/**
 * Revokes a capability token
 */
export function revokeCapability(token: CapabilityToken, reason: string): CapabilityToken {
  return {
    ...token,
    active: false,
    auditLog: [...(token.auditLog || []), `Revoked: ${reason}`],
  };
}

/**
 * Adds constraint to capability
 */
export function addConstraint(token: CapabilityToken, constraint: string): CapabilityToken {
  return {
    ...token,
    constraints: [...(token.constraints || []), constraint],
  };
}

/**
 * Logs an action in the capability audit trail
 */
export function logCapabilityUse(token: CapabilityToken, action: string): CapabilityToken {
  return {
    ...token,
    auditLog: [...(token.auditLog || []), `${new Date().toISOString()}: ${action}`],
  };
}
