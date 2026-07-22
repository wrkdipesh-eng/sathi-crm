import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'sathi-crm-super-secret-key-for-local-development-change-in-production';

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string;
  branchId: string | null;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}

export function getAuthUser(req: NextRequest): JwtPayload | null {
  const cookie = req.cookies.get('token');
  if (!cookie) return null;
  return verifyToken(cookie.value);
}

/**
 * Returns a Prisma filter condition based on the user's role to enforce data isolation.
 *
 * - SUPERADMIN, DIRECTOR: Full access to all branches/applicants under the organization.
 * - ACCOUNTS, FINANCE: Full access to organization data.
 * - MANAGER, BRANCH_MANAGER: Access restricted to applicants belonging to their primary branch.
 * - SENIOR_COUNSELOR, COUNSELOR: Access restricted to applicants assigned to them.
 * - DOCUMENTATION_OFFICER, FRONT_DESK_OFFICER: View-only access to organization data.
 * - SUB_AGENT: Access restricted to applicants submitted by them.
 * - STUDENT_PORTAL: Can only see their own applicant record.
 */
export function getAccessQueryFilter(user: JwtPayload) {
  const baseFilter = { organizationId: user.organizationId };

  switch (user.role) {
    case Role.SUPERADMIN:
    case Role.DIRECTOR:
    case Role.ACCOUNTS:
    case Role.FINANCE:
    case Role.DOCUMENTATION_OFFICER:
    case Role.FRONT_DESK_OFFICER:
      return baseFilter;

    case Role.MANAGER:
    case Role.BRANCH_MANAGER:
      if (!user.branchId) {
        // Fallback: If manager has no branch, restrict to empty (cannot see everything)
        return { ...baseFilter, branchId: 'NONE' };
      }
      return { ...baseFilter, branchId: user.branchId };

    case Role.SENIOR_COUNSELOR:
    case Role.COUNSELOR:
      return { ...baseFilter, counselorId: user.userId };

    case Role.SUB_AGENT:
      return { ...baseFilter, subAgentId: user.userId };

    case Role.STUDENT_PORTAL:
      // Student portal can only see their own applicant record
      return { ...baseFilter, id: user.userId };

    default:
      // Block access for unrecognized roles
      return { id: 'NONE' };
  }
}

/**
 * Helper to check if a user has permission to perform write actions on a specific applicant.
 */
export function canWriteApplicant(user: JwtPayload, applicantBranchId: string, applicantCounselorId: string | null, applicantSubAgentId: string | null): boolean {
  if (user.role === Role.SUPERADMIN || user.role === Role.DIRECTOR || user.role === Role.ACCOUNTS || user.role === Role.FINANCE) return true;

  if (user.role === Role.MANAGER || user.role === Role.BRANCH_MANAGER) {
    return user.branchId === applicantBranchId;
  }

  if (user.role === Role.SENIOR_COUNSELOR || user.role === Role.COUNSELOR) {
    return user.userId === applicantCounselorId;
  }

  if (user.role === Role.SUB_AGENT) {
    return user.userId === applicantSubAgentId;
  }

  return false;
}
