/**
 * Membership roles and statuses (D9). Plain unions instead of the Prisma
 * enums, so domain rules stay free of the generated client;
 * `src/server/security/membershipAccess.test.ts` locks the two together.
 */

export const MEMBERSHIP_ROLES = ["admin", "leader", "member"] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const MEMBERSHIP_STATUSES = ["active", "deactivated"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];
