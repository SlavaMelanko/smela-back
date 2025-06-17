import { createPasswordEncoder } from '@/lib/crypto'

import db from './db'
import { usersTable } from './schema'

async function seed() {
  await db.delete(usersTable)

  const encoder = createPasswordEncoder()
  const hashedPassword = await encoder.hash('admin')

  await db.insert(usersTable).values([
    {
      firstName: 'Admin',
      lastName: 'Admin',
      email: 'admin@example.com',
      password: hashedPassword,
    },
  ])

  // eslint-disable-next-line no-console
  console.log('✅ Admins seeded')
}

seed().catch((err) => {
  console.error('❌ Failed to seed database:', err)
  process.exit(1)
})
