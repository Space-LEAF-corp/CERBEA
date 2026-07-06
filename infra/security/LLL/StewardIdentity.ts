/**
 * StewardIdentity & LLLIssuer - LLL identity binding and token issuance
 * Manages steward/service identities and capability token lifecycle
 */

import type { CapabilityToken, Capability } from '../../../packages/shared-kernel/src/capabilities/CapabilityToken';

export type StewardRole = 'CAPTAIN' | 'ENGINEER' | 'STUDENT' | 'CHILD' | 'SERVICE';

export interface StewardIdentity {
  id: string;
  name: string;
  role: StewardRole;
  organizationId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Default capability sets per role
 */
const DEFAULT_CAPABILITIES: Record<StewardRole, Capability[]> = {
  CAPTAIN: [
    'DEN_BALANCE',
    'FORGE_SMELT',
    'THERMAL_ANALYTICS_VIEW',
    'GEO_OVERRIDE',
    'CHILD_ZONE_ISOLATE',
    'SIMULATION_RUN',
    'STEWARD_REVIEW',
    'ENERGY_TRANSFER',
    'RISK_ASSESSMENT_VIEW',
  ],
  ENGINEER: [
    'DEN_BALANCE',
    'FORGE_SMELT',
    'THERMAL_ANALYTICS_VIEW',
    'SIMULATION_RUN',
    'ENERGY_TRANSFER',
    'RISK_ASSESSMENT_VIEW',
  ],
  STUDENT: [
    'THERMAL_ANALYTICS_VIEW',
    'SIMULATION_RUN',
    'RISK_ASSESSMENT_VIEW',
  ],
  CHILD: [
    'THERMAL_ANALYTICS_VIEW',
    'SIMULATION_RUN',
  ],
  SERVICE: [
    'THERMAL_ANALYTICS_VIEW',
    'ENERGY_TRANSFER',
    'RISK_ASSESSMENT_VIEW',
  ],
};

export class LLLIssuer {
  private issuedTokens: Map<string, CapabilityToken> = new Map();

  /**
   * Issues a capability token for an identity
   * Defaults to role-based capabilities if not specified
   */
  issueToken(
    identity: StewardIdentity,
    caps?: Capability[],
    ttlMs: number = 60 * 60 * 1000 // 1 hour default
  ): CapabilityToken {
    const now = Date.now();
    
    // Use provided capabilities or fall back to role defaults
    const capabilities = caps || DEFAULT_CAPABILITIES[identity.role] || [];

    const token: CapabilityToken = {
      id: `cap-${identity.id}-${now}-${Math.random().toString(36).substring(7)}`,
      subjectId: identity.id,
      issuedAt: now,
      expiresAt: now + ttlMs,
      capabilities,
      signature: this.sign(identity, capabilities, now),
      role: identity.role,
    };

    this.issuedTokens.set(token.id, token);
    console.log(`[LLL] Token issued for ${identity.name} (${identity.role}): ${token.id}`);

    return token;
  }

  /**
   * Revokes a capability token
   */
  revokeToken(tokenId: string): boolean {
    return this.issuedTokens.delete(tokenId);
  }

  /**
   * Verifies and retrieves a token
   */
  getToken(tokenId: string): CapabilityToken | null {
    const token = this.issuedTokens.get(tokenId);
    if (!token) return null;

    // Check expiration
    if (Date.now() > token.expiresAt) {
      this.issuedTokens.delete(tokenId);
      return null;
    }

    return token;
  }

  /**
   * Renews a token with the same capabilities
   */
  renewToken(token: CapabilityToken, additionalTtlMs: number = 60 * 60 * 1000): CapabilityToken {
    const newToken: CapabilityToken = {
      ...token,
      id: `cap-${token.subjectId}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      issuedAt: Date.now(),
      expiresAt: Date.now() + additionalTtlMs,
      signature: this.sign(
        { id: token.subjectId, name: 'renewed', role: token.role || 'SERVICE' },
        token.capabilities,
        Date.now()
      ),
    };

    this.issuedTokens.set(newToken.id, newToken);
    this.revokeToken(token.id);

    return newToken;
  }

  /**
   * Upgrades token with additional capabilities (Captain only)
   */
  upgradeCapabilities(
    token: CapabilityToken,
    additionalCaps: Capability[],
    captainToken?: CapabilityToken
  ): CapabilityToken {
    // Verify issuer authority (captain role)
    if (captainToken?.role !== 'CAPTAIN') {
      throw new Error('Only CAPTAIN role can upgrade capabilities');
    }

    const newCaps = Array.from(new Set([...token.capabilities, ...additionalCaps]));

    const upgradedToken: CapabilityToken = {
      ...token,
      id: `cap-${token.subjectId}-${Date.now()}-upgraded`,
      capabilities: newCaps,
      signature: this.sign(
        { id: token.subjectId, name: 'upgraded', role: token.role || 'SERVICE' },
        newCaps,
        Date.now()
      ),
    };

    this.issuedTokens.set(upgradedToken.id, upgradedToken);
    this.revokeToken(token.id);

    console.log(
      `[LLL] Token upgraded for ${token.subjectId}: +${additionalCaps.join(', ')}`
    );

    return upgradedToken;
  }

  /**
   * Gets all active tokens for debugging/monitoring
   */
  getActiveTokens(): CapabilityToken[] {
    const now = Date.now();
    return Array.from(this.issuedTokens.values()).filter(t => t.expiresAt > now);
  }

  /**
   * Signs a token (placeholder for FAAO/cryptographic signing)
   * In production, this would use real cryptographic signatures
   */
  private sign(identity: StewardIdentity, caps: Capability[], issuedAt: number): string {
    const data = `${identity.id}:${caps.join(',')}:${issuedAt}`;
    // Placeholder: real FAAO/LLL signing later
    return `sig_${Buffer.from(data).toString('base64')}`;
  }
}
