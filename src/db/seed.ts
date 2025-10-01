import { eq } from 'drizzle-orm'

import { hashPassword } from '@/lib/cipher'
import { Action, AuthProvider, Resource, Role, Status } from '@/types'

import db from './db'
import { authTable, permissionsTable, rolePermissionsTable, usersTable } from './schema'

const seedPermissions = async () => {
  const allResources = Object.values(Resource)
  const allActions = Object.values(Action)

  const existingPermissions = await db.select().from(permissionsTable)

  const permissionsToInsert: {
    action: Action
    resource: Resource
  }[] = []

  // Build missing (action, resource) pairs
  for (const resource of allResources) {
    for (const action of allActions) {
      const permissionExists = existingPermissions.some(
        p => p.resource === resource && p.action === action,
      )

      if (!permissionExists) {
        permissionsToInsert.push({ resource, action })
      }
    }
  }

  if (!permissionsToInsert.length) {
    // eslint-disable-next-line no-console
    console.log('✅ Permissions already seeded')

    return
  }

  await db.insert(permissionsTable).values(permissionsToInsert)

  // eslint-disable-next-line no-console
  console.log(`✅ ${permissionsToInsert.length} permissions seeded`)
}

const assignPermissionsToRole = async ({
  role,
  resources,
}: {
  role: Role
  resources: Resource[]
}) => {
  const [allPermissions, existingRolePermissions] = await Promise.all([
    db.select().from(permissionsTable),
    db.select().from(rolePermissionsTable),
  ])

  const permissionsToInsert: { role: Role, permissionId: number }[] = []

  for (const resource of resources) {
    const resourcePermissions = allPermissions.filter(p => p.resource === resource)

    for (const permission of resourcePermissions) {
      const alreadyExists = existingRolePermissions.some(
        rp => rp.role === role && rp.permissionId === permission.id,
      )

      if (!alreadyExists) {
        permissionsToInsert.push({ role, permissionId: permission.id })
      }
    }
  }

  if (!permissionsToInsert.length) {
    // eslint-disable-next-line no-console
    console.log(`✅ Permissions already seeded for role ${role}`)

    return
  }

  await db.insert(rolePermissionsTable).values(permissionsToInsert)

  // eslint-disable-next-line no-console
  console.log(
    `✅ Seeded ${permissionsToInsert.length} permissions for role ${role}`,
  )
}

const seedOwnerPermissions = async () => {
  await assignPermissionsToRole({
    role: Role.Owner,
    resources: [Resource.Users, Resource.Admins],
  })
}

const seedDefaultAdminPermissions = async () => {
  await assignPermissionsToRole({
    role: Role.Admin,
    resources: [Resource.Users],
  })
}

const seedAdmins = async () => {
  const admins = [
    {
      firstName: 'Jason',
      email: 'jason@example.com',
      password: 'Passw0rd!', // plain text for seeding; will be hashed
    },
    {
      firstName: 'Billy',
      email: 'billy@example.com',
      password: 'Passw0rd!',
    },
  ]

  for (const admin of admins) {
    const [existingUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, admin.email))

    if (!existingUser) {
      const hashedPassword = await hashPassword(admin.password)

      // 1. Create user
      const [createdUser] = await db
        .insert(usersTable)
        .values({
          firstName: admin.firstName,
          email: admin.email,
          role: Role.Admin,
          status: Status.Active,
        })
        .returning({ id: usersTable.id })

      // 2. Create auth entry
      await db.insert(authTable).values({
        userId: createdUser.id,
        provider: AuthProvider.Local,
        identifier: admin.email,
        passwordHash: hashedPassword,
      })

      // eslint-disable-next-line no-console
      console.log(`✅ Admin ${admin.email} seeded`)
    } else {
      // eslint-disable-next-line no-console
      console.log(`✅ Admin ${admin.email} already exists`)
    }
  }
}

const seed = async () => {
  await seedPermissions()
  await seedOwnerPermissions()
  await seedDefaultAdminPermissions()
  await seedAdmins()
}

seed().catch((err) => {
  console.error('❌ Failed to seed database:', err)
  process.exit(1)
})
