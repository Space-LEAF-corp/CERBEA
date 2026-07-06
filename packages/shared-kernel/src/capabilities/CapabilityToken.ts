/**
 * CapabilityToken - FAAO/LLL Capability-based Access Control
 * Defines tokens, capabilities, and verification for distributed authorization
 */

export type Capability =
  | 'DEN_BALANCE'
  | 'FORGE_SMELT'
  | 'THERMAL_ANALYTICS_VIEW'
  | 'GEO_OVERRIDE'
  | 'CHILD_ZONE_ISOLATE'
  | 'SIMULATION_RUN'
  | 'STEWARD_REVIEW'
  | 'ENERGY_TRANSFER'
  | 'RISK_ASSESSMENT_VIEW';

export interface CapabilityToken {
  id: string;
  subjectId: string; // steward id, node id, service id
  issuedAt: number;
  expiresAt: number;
  capabilities: Capability[];
  signature: string; // FAAO/LLL signed
  role?: 'CAPTAIN' | 'ENGINEER' | 'STUDENT' | 'CHILD' | 'SERVICE';
}

/**
 * Checks if a token has a required capability and is not expired
 */
export function hasCapability(token: CapabilityToken | null, cap: Capability): boolean {
  if (!token) return false;
  const now = Date.now();
  if (now > token.expiresAt) return false;
  return token.capabilities.includes(cap);
}

/**
 * Checks multiple capabilities (all must be present)
 */
export function hasAllCapabilities(token: CapabilityToken | null, caps: Capability[]): boolean {
  if (!token) return false;
  const now = Date.now();
  if (now > token.expiresAt) return false;
  return caps.every(cap => token.capabilities.includes(cap));
}

/**
 * Checks if token has any of the given capabilities
 */
export function hasAnyCapability(token: CapabilityToken | null, caps: Capability[]): boolean {
  if (!token) return false;
  const now = Date.now();
  if (now > token.expiresAt) return false;
  return caps.some(cap => token.capabilities.includes(cap));
}

/**
 * Gets remaining TTL in milliseconds
 */
export function getTokenTTL(token: CapabilityToken | null): number {
  if (!token) return 0;
  const now = Date.now();
  const remaining = token.expiresAt - now;
  return Math.max(0, remaining);
}

/**
 * Checks if token is expired
 */
export function isTokenExpired(token: CapabilityToken | null): boolean {
  if (!token) return true;
  return Date.now() > token.expiresAt;
}
