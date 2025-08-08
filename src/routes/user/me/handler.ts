import type { Context } from 'hono'

import type { AppContext } from '@/types/context'

import { AppError, ErrorCode } from '@/lib/catch'
import { userRepo } from '@/repositories'

const updateProfile = async (c: Context<AppContext>) => {
  const user = c.get('user')
  const { firstName, lastName } = await c.req.json()

  const updatedUser = await userRepo.update(user.id, {
    firstName,
    lastName,
    updatedAt: new Date(),
  })

  if (!updatedUser) {
    throw new AppError(ErrorCode.InternalError, 'Failed to update user.')
  }

  const { tokenVersion, ...userWithoutSensitiveFields } = updatedUser

  return c.json({ user: userWithoutSensitiveFields })
}

export default updateProfile
