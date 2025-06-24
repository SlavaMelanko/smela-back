import { eq } from 'drizzle-orm'

import { createPasswordEncoder } from '@/lib/crypto'
import { Action, AuthProvider, Resource, Role, Status } from '@/types'

import db from './db'
import { authTable, permissionsTable, rolePermissionsTable, rolesTable, usersTable } from './schema'

const seedRoles = async () => {
  const rolesToSeed = Object.values(Role).map(name => ({ name }))

  const existingRoles = await db.select().from(rolesTable)
  const rolesToInsert = rolesToSeed.filter(
    role => !existingRoles.some(existing => existing.name === role.name),
  )

  if (!rolesToInsert.length) {
    // eslint-disable-next-line no-console
    console.log('✅ Roles already seeded')

    return
  }

  await db.insert(rolesTable).values(rolesToInsert)

  // eslint-disable-next-line no-console
  console.log(`✅ ${rolesToInsert.length} roles seeded`)
}

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
  role: { id: number, name: string }
  resources: Resource[]
}) => {
  const [allPermissions, existingRolePermissions] = await Promise.all([
    db.select().from(permissionsTable),
    db.select().from(rolePermissionsTable),
  ])

  const permissionsToInsert: { roleId: number, permissionId: number }[] = []

  for (const resource of resources) {
    const resourcePermissions = allPermissions.filter(p => p.resource === resource)

    for (const permission of resourcePermissions) {
      const alreadyExists = existingRolePermissions.some(
        rp => rp.roleId === role.id && rp.permissionId === permission.id,
      )

      if (!alreadyExists) {
        permissionsToInsert.push({ roleId: role.id, permissionId: permission.id })
      }
    }
  }

  if (!permissionsToInsert.length) {
    // eslint-disable-next-line no-console
    console.log(`✅ Permissions already seeded for role ${role.name}`)

    return
  }

  await db.insert(rolePermissionsTable).values(permissionsToInsert)

  // eslint-disable-next-line no-console
  console.log(
    `✅ Seeded ${permissionsToInsert.length} permissions for role ${role.name}`,
  )
}

const seedOwnerPermissions = async () => {
  const [ownerRole] = await db
    .select()
    .from(rolesTable)
    .where(eq(rolesTable.name, Role.Owner))

  if (!ownerRole) {
    console.warn('⚠️ Owner role not found, skipping owner permissions seeding.')

    return
  }

  await assignPermissionsToRole({
    role: { id: ownerRole.id, name: Role.Owner },
    resources: [Resource.Users, Resource.Admins],
  })
}

const seedDefaultAdminPermissions = async () => {
  const [adminRole] = await db
    .select()
    .from(rolesTable)
    .where(eq(rolesTable.name, Role.Admin))

  if (!adminRole) {
    console.warn('⚠️ Admin role not found, skipping admin permissions seeding.')

    return
  }

  await assignPermissionsToRole({
    role: { id: adminRole.id, name: Role.Admin },
    resources: [Resource.Users],
  })
}

const seedAdmins = async () => {
  const [adminRole] = await db.select().from(rolesTable).where(eq(rolesTable.name, Role.Admin))

  if (!adminRole) {
    console.warn('⚠️ Admin role not found, skipping admin seeding.')

    return
  }

  const admins = [
    {
      firstName: 'Jason',
      email: 'jason.admin@example.com',
      password: 'Passw0rd!', // plain text for seeding; will be hashed
    },
    {
      firstName: 'Billy',
      email: 'billy.admin@example.com',
      password: 'Passw0rd!',
    },
  ]

  for (const admin of admins) {
    const [existingUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, admin.email))

    if (!existingUser) {
      const encoder = createPasswordEncoder()
      const hashedPassword = await encoder.hash(admin.password)

      // 1. Create user
      const [createdUser] = await db
        .insert(usersTable)
        .values({
          firstName: admin.firstName,
          email: admin.email,
          roleId: adminRole.id,
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
  await seedRoles()
  await seedPermissions()
  await seedOwnerPermissions()
  await seedDefaultAdminPermissions()
  await seedAdmins()
}

seed().catch((err) => {
  console.error('❌ Failed to seed database:', err)
  process.exit(1)
})
