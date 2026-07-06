/**
 * CapabilityEnforcer - FAAO enforcement layer
 * Validates capability tokens before sensitive operations
 */

import type { CapabilityToken, Capability } from '../../../packages/shared-kernel/src/capabilities/CapabilityToken';
import { hasCapability, hasAllCapabilities, isTokenExpired } from '../../../packages/shared-kernel/src/capabilities/CapabilityToken';

export class CapabilityRequiredError extends Error {
  constructor(public capability: Capability, public subjectId?: string) {
    super(`Capability '${capability}' required${subjectId ? ` for ${subjectId}` : ''}`);
    this.name = 'CapabilityRequiredError';
  }
}

export class TokenExpiredError extends Error {
  constructor(public subjectId: string) {
    super(`Token expired for subject ${subjectId}`);
    this.name = 'TokenExpiredError';
  }
}

export class CapabilityEnforcer {
  /**
   * Requires a single capability
   * @throws CapabilityRequiredError if token lacks capability
   * @throws TokenExpiredError if token is expired
   */
  require(token: CapabilityToken | null, cap: Capability): void {
    if (!token) {
      throw new CapabilityRequiredError(cap);
    }

    if (isTokenExpired(token)) {
      throw new TokenExpiredError(token.subjectId);
    }

    if (!hasCapability(token, cap)) {
      throw new CapabilityRequiredError(cap, token.subjectId);
    }
  }

  /**
   * Requires all capabilities in the list
   * @throws CapabilityRequiredError if any capability is missing
   * @throws TokenExpiredError if token is expired
   */
  requireAll(token: CapabilityToken | null, caps: Capability[]): void {
    if (!token) {
      throw new CapabilityRequiredError(caps[0]);
    }

    if (isTokenExpired(token)) {
      throw new TokenExpiredError(token.subjectId);
    }

    const missing = caps.find(cap => !token.capabilities.includes(cap));
    if (missing) {
      throw new CapabilityRequiredError(missing, token.subjectId);
    }
  }

  /**
   * Requires at least one of the capabilities
   * @throws CapabilityRequiredError if none of the capabilities are present
   * @throws TokenExpiredError if token is expired
   */
  requireAny(token: CapabilityToken | null, caps: Capability[]): void {
    if (!token) {
      throw new CapabilityRequiredError(caps[0]);
    }

    if (isTokenExpired(token)) {
      throw new TokenExpiredError(token.subjectId);
    }

    const hasAny = caps.some(cap => token.capabilities.includes(cap));
    if (!hasAny) {
      throw new CapabilityRequiredError(caps[0], token.subjectId);
    }
  }

  /**
   * Silently checks if a capability is present
   * @returns true if token has capability and is not expired
   */
  check(token: CapabilityToken | null, cap: Capability): boolean {
    return hasCapability(token, cap);
  }

  /**
   * Silently checks if all capabilities are present
   */
  checkAll(token: CapabilityToken | null, caps: Capability[]): boolean {
    return hasAllCapabilities(token, caps);
  }

  /**
   * Gets list of missing capabilities
   */
  getMissing(token: CapabilityToken | null, caps: Capability[]): Capability[] {
    if (!token) return caps;
    return caps.filter(cap => !token.capabilities.includes(cap));
  }

  /**
   * Audits a token and capability check
   */
  audit(token: CapabilityToken | null, cap: Capability, allowed: boolean): void {
    const timestamp = new Date().toISOString();
    const subjectId = token?.subjectId || 'UNKNOWN';
    const status = allowed ? 'ALLOWED' : 'DENIED';
    console.log(`[FAAO-AUDIT] ${timestamp} | ${status} | Subject: ${subjectId} | Capability: ${cap}`);
  }
}
