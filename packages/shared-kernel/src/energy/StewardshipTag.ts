/**
 * StewardshipTag - Accountability and traceability for energy and materials
 * Ensures ethical oversight and auditable energy flow
 */

export interface StewardshipTag {
  /** Unique tag identifier */
  id: string;

  /** Steward responsible for this resource */
  stewardId: string;

  /** Resource type (energy, material, etc.) */
  resourceType: string;

  /** Timestamp when stewardship began */
  startTime: Date;

  /** Optional end time for completed stewardship */
  endTime?: Date;

  /** Approval status */
  approved: boolean;

  /** Approver identity */
  approver?: string;

  /** Compliance notes or restrictions */
  restrictions?: string[];

  /** Child safety flag */
  childSafetyChecked: boolean;

  /** Associated metadata */
  metadata?: Record<string, any>;
}

/**
 * Creates a new stewardship tag
 */
export function createStewardshipTag(
  stewardId: string,
  resourceType: string,
  childSafetyChecked: boolean = true
): StewardshipTag {
  return {
    id: `steward-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    stewardId,
    resourceType,
    startTime: new Date(),
    approved: false,
    childSafetyChecked,
  };
}

/**
 * Approves a stewardship tag
 */
export function approveStewardshipTag(tag: StewardshipTag, approverId: string): StewardshipTag {
  return {
    ...tag,
    approved: true,
    approver: approverId,
  };
}

/**
 * Completes stewardship and closes the tag
 */
export function completeStewardship(tag: StewardshipTag): StewardshipTag {
  return {
    ...tag,
    endTime: new Date(),
  };
}

/**
 * Verifies stewardship tag is valid and active
 */
export function isValidStewardshipTag(tag: StewardshipTag): boolean {
  return (
    tag.approved &&
    tag.childSafetyChecked &&
    (!tag.restrictions || tag.restrictions.length >= 0) &&
    !tag.endTime
  );
}

/**
 * Transfers stewardship to a new steward
 */
export function transferStewardship(
  tag: StewardshipTag,
  newStewardId: string,
  approverId: string
): StewardshipTag {
  const newTag = createStewardshipTag(newStewardId, tag.resourceType, tag.childSafetyChecked);
  return approveStewardshipTag(newTag, approverId);
}
