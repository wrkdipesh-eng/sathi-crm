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
 * - DIRECTOR: Full access to all branches/applicants under the organization.
 * - BRANCH_MANAGER: Access restricted to applicants belonging to their primary branch.
 * - FINANCE: Access restricted to their branch.
 * - COUNSELOR: Access restricted to applicants assigned to them.
 * - SUB_AGENT: Access restricted to applicants submitted by them.
 */
export function getAccessQueryFilter(user: JwtPayload) {
  const baseFilter = { organizationId: user.organizationId };

  switch (user.role) {
    case Role.DIRECTOR:
    case Role.FINANCE:
      return baseFilter;
      
    case Role.BRANCH_MANAGER:
      if (!user.branchId) {
        // Fallback: If manager has no branch, restrict to empty (cannot see everything)
        return { ...baseFilter, branchId: 'NONE' };
      }
      return { ...baseFilter, branchId: user.branchId };
      
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
  if (user.role === Role.DIRECTOR || user.role === Role.FINANCE) return true;
  
  if (user.role === Role.BRANCH_MANAGER) {
    return user.branchId === applicantBranchId;
  }
  
  if (user.role === Role.COUNSELOR) {
    return user.userId === applicantCounselorId;
  }
  
  if (user.role === Role.SUB_AGENT) {
    return user.userId === applicantSubAgentId;
  }
  
  return false;
}
