/* eslint-disable no-console */

/**
 * Seed initial data required to start the application
 *
 * Seeds: permissions, role-permission mappings, initial users (owner, admin, test users)
 *
 * Usage:
 *   bun run db:seed
 */

import { eq } from 'drizzle-orm'

import { hashPassword } from '@/security/password'
import { Action, AuthProvider, Resource, Role, Status } from '@/types'

import { db } from '../clients'
import { authTable, companiesTable, permissionsTable, rolePermissionsTable, userCompaniesTable, usersTable } from '../schema'

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

const seedCompany = async () => {
  const [existingCompany] = await db
    .select()
    .from(companiesTable)
    .where(eq(companiesTable.name, 'SMELA'))

  if (existingCompany) {
    console.log('✅ SMELA company already exists')

    return existingCompany.id
  }

  const [company] = await db.insert(companiesTable).values({
    name: 'SMELA',
    website: 'https://smela.com',
    description: 'SMELA - Smart Management and Enterprise Learning Application',
  }).returning({ id: companiesTable.id })

  console.log('✅ SMELA company seeded')

  return company.id
}

const seedUsers = async (companyId: string) => {
  const users = [
    {
      firstName: 'Slava',
      lastName: 'Owner',
      email: 'slava.owner@smela.com',
      password: 'Passw0rd!',
      role: Role.Owner,
      status: Status.Active,
      position: 'Owner',
    },
    {
      firstName: 'Slava',
      lastName: 'Admin',
      email: 'slava.admin@smela.com',
      password: 'Passw0rd!',
      role: Role.Admin,
      status: Status.Active,
      position: 'Admin',
    },
  ]

  for (const user of users) {
    const [existingUser] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, user.email))

    if (existingUser) {
      // Ensure user is linked to company
      const [existingLink] = await db
        .select()
        .from(userCompaniesTable)
        .where(eq(userCompaniesTable.userId, existingUser.id))

      if (!existingLink) {
        await db.insert(userCompaniesTable).values({
          userId: existingUser.id,
          companyId,
          position: user.position,
        })
        console.log(`✅ Linked ${user.email} to SMELA as ${user.position}`)
      } else {
        console.log(`✅ ${user.role} ${user.email} already exists`)
      }

      continue
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

    await db.insert(userCompaniesTable).values({
      userId: createdUser.id,
      companyId,
      position: user.position,
    })

    console.log(`✅ ${user.role} ${user.email} seeded and linked to SMELA`)
  }
}

const seed = async () => {
  await seedPermissions()
  await seedOwnerPermissions()
  await seedDefaultAdminPermissions()
  const companyId = await seedCompany()
  await seedUsers(companyId)
}

seed().catch((err) => {
  console.error('❌ Failed to seed database:', err)
  process.exit(1)
})
