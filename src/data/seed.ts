/* eslint-disable no-console */
import { eq } from 'drizzle-orm'

import { hashPassword } from '@/security/password'
import { Action, AuthProvider, Resource, Role, Status } from '@/types'

import { db } from './clients'
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
    console.log('✅ Permissions already seeded')

    return
  }

  await db.insert(permissionsTable).values(permissionsToInsert)

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
    console.log(`✅ Permissions already seeded for role ${role}`)

    return
  }

  await db.insert(rolePermissionsTable).values(permissionsToInsert)

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

const seedUser = async (user: {
  firstName: string
  lastName?: string
  email: string
  password: string
  role: Role
  status: Status
}) => {
  const [existingUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, user.email))

  if (existingUser) {
    console.log(`✅ ${user.role} ${user.email} already exists`)

    return
  }

  const hashedPassword = await hashPassword(user.password)

  const [createdUser] = await db
    .insert(usersTable)
    .values({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      status: user.status,
    })
    .returning({ id: usersTable.id })

  await db.insert(authTable).values({
    userId: createdUser.id,
    provider: AuthProvider.Local,
    identifier: user.email,
    passwordHash: hashedPassword,
  })

  console.log(`✅ ${user.role} ${user.email} seeded`)
}

const seedUsers = async () => {
  const users = [
    // Owner
    {
      firstName: 'Slava',
      lastName: 'Owner',
      email: 'slava.owner@smela.com',
      password: 'Passw0rd!',
      role: Role.Owner,
      status: Status.Active,
    },
    // Admin
    {
      firstName: 'Slava',
      lastName: 'Admin',
      email: 'slava.admin@smela.com',
      password: 'Passw0rd!',
      role: Role.Admin,
      status: Status.Active,
    },
    // Enterprise user (active)
    {
      firstName: 'Emma',
      lastName: 'Enterprise',
      email: 'emma.enterprise@smela.com',
      password: 'Passw0rd!',
      role: Role.Enterprise,
      status: Status.Active,
    },
    // Regular user (new status)
    {
      firstName: 'Noah',
      lastName: 'Newuser',
      email: 'noah.newuser@smela.com',
      password: 'Passw0rd!',
      role: Role.User,
      status: Status.New,
    },
    // Regular user (verified status)
    {
      firstName: 'Olivia',
      lastName: 'Verified',
      email: 'olivia.verified@smela.com',
      password: 'Passw0rd!',
      role: Role.User,
      status: Status.Verified,
    },
  ]

  for (const user of users) {
    await seedUser(user)
  }
}

const seed = async () => {
  await seedPermissions()
  await seedOwnerPermissions()
  await seedDefaultAdminPermissions()
  await seedUsers()
}

seed().catch((err) => {
  console.error('❌ Failed to seed database:', err)
  process.exit(1)
})
