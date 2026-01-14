import { verifyDbConnection } from '@/data/clients/db'
import { initErrorTracker } from '@/services'

import Server from './server'

initErrorTracker()

verifyDbConnection().catch(() => {
  process.exit(1)
})

const server = new Server()

export default server.getApp()
