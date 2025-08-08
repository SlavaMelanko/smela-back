import { Hono } from 'hono'

import logoutHandler from './handler'

const logout = new Hono()

logout.post('/logout', logoutHandler)

export default logout
