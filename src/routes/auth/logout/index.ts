import { Hono } from 'hono'

import type { AppContext } from '@/context'

import logoutHandler from './handler'

const logout = new Hono<AppContext>()

logout.post('/logout', logoutHandler)

export default logout
