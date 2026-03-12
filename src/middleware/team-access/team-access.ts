import { createMiddleware } from 'hono/factory'

import type { AppContext } from '@/context'

import { teamRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { isAdmin } from '@/types'

/**
 * Team access middleware - ensures the caller has access to a team resource.
 *
 * Resolves the team context from route params in order:
 * - teamId: direct team access — caller must be a member of that team
 * - userId: cross-user access — caller must share a team with the target user
 *
 * Admins and owners bypass the membership check entirely.
 *
 * Note: params are already validated by requestValidator middleware
 *
 * TODO: Add Redis caching for team membership queries
 * Currently queries database on every request (~1-5ms per query).
 * With Redis cache: 80-95% hit rate, 20-50x faster response time.
 * See: https://github.com/SlavaMelanko/smela-back/issues/58
 */
export const teamAccessMiddleware = createMiddleware<AppContext>(async (c, next) => {
  const { id: callerId, role } = c.get('user')

  // Admins and owners have access to all teams and users
  if (isAdmin(role)) {
    return next()
  }

  const teamId = c.req.param('teamId')

  if (teamId) {
    const membership = await teamRepo.findMember(teamId, callerId)

    if (!membership) {
      throw new AppError(ErrorCode.Forbidden)
    }

    return next()
  }

  const targetUserId = c.req.param('userId')

  if (targetUserId) {
    const sharedTeam = await teamRepo.findSharedTeam(callerId, targetUserId)

    if (!sharedTeam) {
      throw new AppError(ErrorCode.Forbidden)
    }

    return next()
  }

  throw new AppError(ErrorCode.Forbidden)
})
