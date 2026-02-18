import { createMiddleware } from 'hono/factory'

import type { AppContext } from '@/context'

import { teamRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { isAdmin } from '@/types'

/**
 * Team access middleware - ensures user has access to the team.
 *
 * Note: teamId is already validated by requestValidator middleware
 *
 * TODO: Add Redis caching for team membership queries
 * Currently queries database on every request (~1-5ms per query).
 * With Redis cache: 80-95% hit rate, 20-50x faster response time.
 * See: https://github.com/SlavaMelanko/smela-back/issues/58
 */
export const teamAccessMiddleware = createMiddleware<AppContext>(async (c, next) => {
  const teamId = c.req.param('teamId')!
  const { id: userId, role } = c.get('user')

  // Admins and owners have access to all teams
  if (isAdmin(role)) {
    return next()
  }

  // Regular users must be team members
  const membership = await teamRepo.findMember(teamId, userId)

  if (!membership) {
    throw new AppError(ErrorCode.Forbidden)
  }

  return next()
})
