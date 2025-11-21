import { verifyDbConnection } from '@/data/clients/db'

import Server from './server'

verifyDbConnection().catch(() => {
  process.exit(1)
})

const server = new Server()

export default server.getApp()
