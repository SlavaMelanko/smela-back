import { Hono } from 'hono'

import type { AppContext } from '@/context'

import { userByIdRoute } from './$id'

export const usersRoute = new Hono<AppContext>()

usersRoute.route('/users/:userId', userByIdRoute)
