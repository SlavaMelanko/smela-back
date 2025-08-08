import { Hono } from 'hono'

import type { AppContext } from '@/types/context'

import { AppError, ErrorCode } from '@/lib/catch'
import { requestValidator } from '@/lib/validation'
import { userRepo } from '@/repositories'

import updateProfile from './handler'
import updateProfileSchema from './schema'

const meRoute = new Hono<AppContext>()

meRoute.get('/me', async (c) => {
  const jwtPayload = c.get('user')
  
  // Fetch full user data from database
  const user = await userRepo.findById(jwtPayload.id)
  
  if (!user) {
    throw new AppError(ErrorCode.NotFound, 'User not found')
  }
  
  // Remove sensitive fields (same as login/signup)
  const { tokenVersion, ...userWithoutSensitiveFields } = user

  return c.json({ user: userWithoutSensitiveFields })
})

meRoute.post('/me', requestValidator('json', updateProfileSchema), updateProfile)

export default meRoute
