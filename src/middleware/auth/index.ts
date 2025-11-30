import {
  isActive,
  isActiveOnly,
  isAdmin,
  isEnterprise,
  isNewOrActive,
  isOwner,
  isUser,
  isUserOrAdmin,
} from '@/types'

import createAuthMiddleware from './factory'

/**
 * Relaxed user authentication middleware - allows new users.
 * - Uses JWT via Authorization: Bearer <token> header.
 * - Allows users with status New, Verified, Trial, or Active.
 * - Accepts all roles: User, Enterprise, Admin, Owner.
 */
export const userRelaxedAuthMiddleware = createAuthMiddleware(isNewOrActive, isUserOrAdmin)

/**
 * Strict user authentication middleware - requires verified users only.
 * - Uses JWT via Authorization: Bearer <token> header.
 * - Requires user status to be Verified, Trial, or Active.
 * - Requires user role to be User or Enterprise.
 */
export const userStrictAuthMiddleware = createAuthMiddleware(isActive, isUser)

/**
 * Strict enterprise authentication middleware - requires fully active enterprise users only.
 * - Uses JWT via Authorization: Bearer <token> header.
 * - Requires user status to be exactly Active (not Verified or Trial).
 * - Requires user role to be Enterprise only (not User).
 */
export const enterpriseStrictAuthMiddleware = createAuthMiddleware(isActiveOnly, isEnterprise)

/**
 * Admin authentication middleware - requires admin privileges.
 * - Uses JWT via Authorization: Bearer <token> header.
 * - Requires user status to be exactly Active (not Verified or Trial).
 * - Requires user role to be Admin or Owner.
 */
export const adminAuthMiddleware = createAuthMiddleware(isActiveOnly, isAdmin)

/**
 * Owner authentication middleware - requires owner privileges.
 * - Uses JWT via Authorization: Bearer <token> header.
 * - Requires user status to be exactly Active (not Verified or Trial).
 * - Requires user role to be Owner only.
 * - Use this for critical operations like adding/removing admins.
 */
export const ownerAuthMiddleware = createAuthMiddleware(isActiveOnly, isOwner)
