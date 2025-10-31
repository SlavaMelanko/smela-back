import { isActive, isActiveOnly, isAdmin, isEnterprise, isNewOrActive, isOwner, isUser } from '@/types'

import createAuthMiddleware from './factory'

/**
 * Strict user authentication middleware - requires verified users only.
 * - For API/CLI/Mobile: Use Authorization: Bearer <token>.
 * - For Browser: Use cookie (automatically set on login).
 * - Requires user status to be Verified, Trial, or Active.
 * - Requires user role to be User or Enterprise.
 */
export const userStrictAuthMiddleware = createAuthMiddleware(isActive, isUser)

/**
 * Relaxed user authentication middleware - allows new users.
 * - Same authentication methods as userStrictAuthMiddleware.
 * - Allows users with status New, Verified, Trial, or Active.
 * - Requires user role to be User or Enterprise.
 */
export const userRelaxedAuthMiddleware = createAuthMiddleware(isNewOrActive, isUser)

/**
 * Strict enterprise authentication middleware - requires fully active enterprise users only.
 * - For API/CLI/Mobile: Use Authorization: Bearer <token>.
 * - For Browser: Use cookie (automatically set on login).
 * - Requires user status to be exactly Active (not Verified or Trial).
 * - Requires user role to be Enterprise only (not User).
 */
export const enterpriseStrictAuthMiddleware = createAuthMiddleware(isActiveOnly, isEnterprise)

/**
 * Admin authentication middleware - requires admin privileges.
 * - For API/CLI/Mobile: Use Authorization: Bearer <token>.
 * - For Browser: Use cookie (automatically set on login).
 * - Requires user status to be exactly Active (not Verified or Trial).
 * - Requires user role to be Admin or Owner.
 */
export const adminAuthMiddleware = createAuthMiddleware(isActiveOnly, isAdmin)

/**
 * Owner authentication middleware - requires owner privileges.
 * - For API/CLI/Mobile: Use Authorization: Bearer <token>.
 * - For Browser: Use cookie (automatically set on login).
 * - Requires user status to be exactly Active (not Verified or Trial).
 * - Requires user role to be Owner only.
 * - Use this for critical operations like adding/removing admins.
 */
export const ownerAuthMiddleware = createAuthMiddleware(isActiveOnly, isOwner)
