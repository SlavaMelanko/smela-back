import { hash } from 'bcrypt'

import db from './db'
import { usersTable } from './schema'

async function seed() {
  await db.delete(usersTable)

  await db.insert(usersTable).values([
    {
      firstName: 'Admin',
      lastName: 'Admin',
      email: 'admin@example.com',
      password: await hash('admin', 10),
    },
  ])

  // eslint-disable-next-line no-console
  console.log('✅ Admins seeded')
}

seed().catch((err) => {
  console.error('❌ Failed to seed admin users:', err)
  process.exit(1)
})
