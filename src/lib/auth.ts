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

/**
 * Check if user can access the admin settings panel (user/branch/university management).
 * Only SUPERADMIN and DIRECTOR can access settings.
 */
export function canAccessSettings(user: JwtPayload): boolean {
  return user.role === Role.SUPERADMIN || user.role === Role.DIRECTOR;
}

/**
 * Check if user can access the finance/commissions page.
 * SUPERADMIN, DIRECTOR, ACCOUNTS, and FINANCE roles can access.
 */
export function canAccessFinance(user: JwtPayload): boolean {
  switch (user.role) {
    case Role.SUPERADMIN:
    case Role.DIRECTOR:
    case Role.ACCOUNTS:
    case Role.FINANCE:
      return true;
    default:
      return false;
  }
}

/**
 * Check if user can view applicants (any applicants, not just their own).
 * All roles except STUDENT_PORTAL and SUB_AGENT have general applicant access.
 */
export function canViewApplicants(user: JwtPayload): boolean {
  return user.role !== Role.STUDENT_PORTAL && user.role !== Role.SUB_AGENT;
}

/**
 * Check if user can edit applicants (create, update).
 * SUB_AGENT is view-only for other's leads; STUDENT_PORTAL is read-only.
 */
export function canCreateApplicant(user: JwtPayload): boolean {
  switch (user.role) {
    case Role.STUDENT_PORTAL:
    case Role.SUB_AGENT:
    case Role.DOCUMENTATION_OFFICER:
    case Role.FRONT_DESK_OFFICER:
      return false;
    default:
      return true;
  }
}

/**
 * Check if user can delete applicants.
 * Only SUPERADMIN, DIRECTOR, and BRANCH_MANAGER can delete.
 */
export function canDeleteApplicant(user: JwtPayload): boolean {
  switch (user.role) {
    case Role.SUPERADMIN:
    case Role.DIRECTOR:
    case Role.BRANCH_MANAGER:
      return true;
    default:
      return false;
  }
}

/**
 * Check if user can manage staff/users.
 * Only SUPERADMIN and DIRECTOR can manage users.
 */
export function canManageUsers(user: JwtPayload): boolean {
  return user.role === Role.SUPERADMIN || user.role === Role.DIRECTOR;
}

/**
 * Check if user can view/export financial reports.
 * SUPERADMIN, DIRECTOR, ACCOUNTS, and FINANCE can view financials.
 */
export function canViewFinancials(user: JwtPayload): boolean {
  switch (user.role) {
    case Role.SUPERADMIN:
    case Role.DIRECTOR:
    case Role.ACCOUNTS:
    case Role.FINANCE:
      return true;
    default:
      return false;
  }
}

/**
 * Check if user can modify financial records (invoices, commission splits).
 * Only SUPERADMIN, DIRECTOR, and FINANCE can modify.
 */
export function canModifyFinancials(user: JwtPayload): boolean {
  switch (user.role) {
    case Role.SUPERADMIN:
    case Role.DIRECTOR:
    case Role.FINANCE:
      return true;
    default:
      return false;
  }
}
