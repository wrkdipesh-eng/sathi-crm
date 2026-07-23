import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'sathi-crm-super-secret-key-for-local-development-change-in-production';

export interface UserPermissions {
  // Core page access
  dashboard_view: boolean;
  applicants_view: boolean;
  applicants_create: boolean;
  applicants_edit: boolean;
  applicants_delete: boolean;
  finance_view: boolean;
  finance_edit: boolean;
  settings_access: boolean;
  users_manage: boolean;

  // Granular scope controls
  applicants_view_all_branches: boolean;     // Can view applicants across all branches
  applicants_view_own_branch_only: boolean;  // Can only view own branch applicants
  finance_view_all_branches: boolean;        // Can view finance across all branches
  finance_view_own_branch_only: boolean;     // Can only view own branch finance
  settings_organization_only: boolean;       // Can access org settings (no user/branch ops)
  users_create_standard_only: boolean;       // Can only create standard users, not admins
}

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string;
  branchId: string | null;
  permissions?: UserPermissions;
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
 * Returns a Prisma filter condition for Visitor records, branch-scoped since
 * Visitor has no counselorId/subAgentId to filter by individually.
 *
 * - SUPERADMIN, DIRECTOR, ACCOUNTS, FINANCE, DOCUMENTATION_OFFICER,
 *   FRONT_DESK_OFFICER: Full access to all branches under the organization.
 * - MANAGER, BRANCH_MANAGER, SENIOR_COUNSELOR, COUNSELOR: Their own branch
 *   only -- visitors are handled at the physical branch, not per-counselor.
 * - SUB_AGENT, STUDENT_PORTAL: No access (walk-in visitors aren't relevant
 *   to a referral partner or a student's own portal view).
 */
export function getVisitorAccessQueryFilter(user: JwtPayload) {
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
    case Role.SENIOR_COUNSELOR:
    case Role.COUNSELOR:
      if (!user.branchId) {
        return { ...baseFilter, branchId: 'NONE' };
      }
      return { ...baseFilter, branchId: user.branchId };

    default:
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

/**
 * Get default permissions for a role (used during user creation)
 */
export function getDefaultPermissionsForRole(role: Role): UserPermissions {
  const defaultPermissions: UserPermissions = {
    dashboard_view: false,
    applicants_view: false,
    applicants_create: false,
    applicants_edit: false,
    applicants_delete: false,
    finance_view: false,
    finance_edit: false,
    settings_access: false,
    users_manage: false,
    applicants_view_all_branches: false,
    applicants_view_own_branch_only: false,
    finance_view_all_branches: false,
    finance_view_own_branch_only: false,
    settings_organization_only: false,
    users_create_standard_only: false,
  };

  switch (role) {
    case Role.SUPERADMIN:
    case Role.DIRECTOR:
      return {
        dashboard_view: true,
        applicants_view: true,
        applicants_create: true,
        applicants_edit: true,
        applicants_delete: true,
        finance_view: true,
        finance_edit: true,
        settings_access: true,
        users_manage: true,
        applicants_view_all_branches: true,
        applicants_view_own_branch_only: false,
        finance_view_all_branches: true,
        finance_view_own_branch_only: false,
        settings_organization_only: false,
        users_create_standard_only: false,
      };

    case Role.ACCOUNTS:
    case Role.FINANCE:
      return {
        dashboard_view: true,
        applicants_view: true,
        applicants_create: false,
        applicants_edit: false,
        applicants_delete: false,
        finance_view: true,
        finance_edit: true,
        settings_access: false,
        users_manage: false,
        applicants_view_all_branches: true,
        applicants_view_own_branch_only: false,
        finance_view_all_branches: true,
        finance_view_own_branch_only: false,
        settings_organization_only: false,
        users_create_standard_only: false,
      };

    case Role.MANAGER:
    case Role.BRANCH_MANAGER:
      return {
        dashboard_view: true,
        applicants_view: true,
        applicants_create: true,
        applicants_edit: true,
        applicants_delete: true,
        finance_view: false,
        finance_edit: false,
        settings_access: false,
        users_manage: false,
        applicants_view_all_branches: false,
        applicants_view_own_branch_only: true,
        finance_view_all_branches: false,
        finance_view_own_branch_only: false,
        settings_organization_only: false,
        users_create_standard_only: false,
      };

    case Role.SENIOR_COUNSELOR:
    case Role.COUNSELOR:
      return {
        dashboard_view: true,
        applicants_view: true,
        applicants_create: true,
        applicants_edit: true,
        applicants_delete: false,
        finance_view: false,
        finance_edit: false,
        settings_access: false,
        users_manage: false,
        applicants_view_all_branches: false,
        applicants_view_own_branch_only: true,
        finance_view_all_branches: false,
        finance_view_own_branch_only: false,
        settings_organization_only: false,
        users_create_standard_only: false,
      };

    case Role.DOCUMENTATION_OFFICER:
    case Role.FRONT_DESK_OFFICER:
      return {
        dashboard_view: true,
        applicants_view: true,
        applicants_create: false,
        applicants_edit: false,
        applicants_delete: false,
        finance_view: false,
        finance_edit: false,
        settings_access: false,
        users_manage: false,
        applicants_view_all_branches: true,
        applicants_view_own_branch_only: false,
        finance_view_all_branches: false,
        finance_view_own_branch_only: false,
        settings_organization_only: false,
        users_create_standard_only: false,
      };

    case Role.SUB_AGENT:
      return {
        dashboard_view: false,
        applicants_view: true,
        applicants_create: true,
        applicants_edit: false,
        applicants_delete: false,
        finance_view: false,
        finance_edit: false,
        settings_access: false,
        users_manage: false,
        applicants_view_all_branches: false,
        applicants_view_own_branch_only: true,
        finance_view_all_branches: false,
        finance_view_own_branch_only: false,
        settings_organization_only: false,
        users_create_standard_only: false,
      };

    case Role.STUDENT_PORTAL:
      return {
        dashboard_view: false,
        applicants_view: true,
        applicants_create: false,
        applicants_edit: false,
        applicants_delete: false,
        finance_view: false,
        finance_edit: false,
        settings_access: false,
        users_manage: false,
        applicants_view_all_branches: false,
        applicants_view_own_branch_only: true,
        finance_view_all_branches: false,
        finance_view_own_branch_only: false,
        settings_organization_only: false,
        users_create_standard_only: false,
      };

    default:
      return defaultPermissions;
  }
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: JwtPayload | null, permission: keyof UserPermissions): boolean {
  if (!user) return false;
  if (!user.permissions) return false;
  return user.permissions[permission] === true;
}

/**
 * Permission check functions for common operations
 */
export function canViewDashboard(user: JwtPayload | null): boolean {
  return hasPermission(user, 'dashboard_view');
}

export function canViewApplicantsPage(user: JwtPayload | null): boolean {
  return hasPermission(user, 'applicants_view');
}

export function canCreateApplicantPage(user: JwtPayload | null): boolean {
  return hasPermission(user, 'applicants_create');
}

export function canEditApplicantPage(user: JwtPayload | null): boolean {
  return hasPermission(user, 'applicants_edit');
}

export function canDeleteApplicantPage(user: JwtPayload | null): boolean {
  return hasPermission(user, 'applicants_delete');
}

export function canViewFinancePage(user: JwtPayload | null): boolean {
  return hasPermission(user, 'finance_view');
}

export function canEditFinancePage(user: JwtPayload | null): boolean {
  return hasPermission(user, 'finance_edit');
}

export function canAccessSettingsPage(user: JwtPayload | null): boolean {
  return hasPermission(user, 'settings_access');
}

export function canManageUsersPage(user: JwtPayload | null): boolean {
  return hasPermission(user, 'users_manage');
}
