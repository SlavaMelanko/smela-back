/* eslint-disable no-console */

/**
 * Seed initial data required to start the application
 *
 * Seeds: permissions, role-permission mappings, initial users (owner, admin, test users)
 *
 * Usage:
 *   bun run db:seed
 */

import { faker } from '@faker-js/faker'
import { eq } from 'drizzle-orm'

import { hashPassword } from '@/security/password'
import { Action, AuthProvider, Resource, Role, Status } from '@/types'

import { db } from '../clients'
import { authTable, companiesTable, permissionsTable, rolePermissionsTable, userCompaniesTable, userRolesTable, usersTable } from '../schema'

// Seed faker for consistent data across runs
faker.seed(42)

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

const seedCompanies = async () => {
  const companies = [
    {
      name: faker.company.name(),
      website: faker.internet.url(),
      description: faker.company.catchPhrase(),
    },
    {
      name: faker.company.name(),
      website: faker.internet.url(),
      description: faker.company.catchPhrase(),
    },
  ]

  let secondCompanyId: string | null = null

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i]

    const [existingCompany] = await db
      .select()
      .from(companiesTable)
      .where(eq(companiesTable.name, company.name))

    if (existingCompany) {
      console.log(`✅ ${company.name} company already exists`)
      if (i === 1) {
        secondCompanyId = existingCompany.id
      }
      continue
    }

    const [createdCompany] = await db.insert(companiesTable).values({
      name: company.name,
      website: company.website,
      description: company.description,
    }).returning({ id: companiesTable.id })

    console.log(`✅ ${company.name} company seeded`)

    if (i === 1) {
      secondCompanyId = createdCompany.id
    }
  }

  return secondCompanyId!
}

// System users (Owner, Admin) - no company linking
const seedSystemUsers = async () => {
  const systemUsers: {
    firstName: string
    lastName: string
    email: string
    password: string
    role: Role
    status: Status
  }[] = [
    {
      firstName: 'Slava',
      lastName: 'Owner',
      email: 'slava.owner@smela.com',
      password: 'Passw0rd!',
      role: Role.Owner,
      status: Status.Active,
    },
    {
      firstName: 'Slava',
      lastName: 'Admin',
      email: 'slava.admin@smela.com',
      password: 'Passw0rd!',
      role: Role.Admin,
      status: Status.Active,
    },
  ]

  for (const user of systemUsers) {
    const [existingUser] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, user.email))

    if (existingUser) {
      console.log(`✅ ${user.role} ${user.email} already exists`)
      continue
    }

    const hashedPassword = await hashPassword(user.password)

    const [createdUser] = await db
      .insert(usersTable)
      .values({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.status,
      })
      .returning({ id: usersTable.id })

    await db.insert(authTable).values({
      userId: createdUser.id,
      provider: AuthProvider.Local,
      identifier: user.email,
      passwordHash: hashedPassword,
    })

    await db.insert(userRolesTable).values({
      userId: createdUser.id,
      role: user.role,
    })

    console.log(`✅ ${user.role} ${user.email} seeded`)
  }
}

// Test users (User role) - linked to company
const seedTestUsers = async (companyId: string) => {
  const testUsers = [
    {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email().toLowerCase(),
      password: 'Passw0rd!',
      status: Status.Active,
      position: 'Developer',
    },
    {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email().toLowerCase(),
      password: 'Passw0rd!',
      status: Status.Pending,
      position: 'Designer',
    },
  ]

  for (const user of testUsers) {
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
        console.log(`✅ Linked ${user.email} to company as ${user.position}`)
      } else {
        console.log(`✅ user ${user.email} already exists`)
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

    console.log(`✅ user ${user.email} seeded and linked to company`)
  }
}

const seed = async () => {
  await seedPermissions()
  await seedOwnerPermissions()
  await seedDefaultAdminPermissions()
  await seedSystemUsers()
  const companyId = await seedCompanies()
  await seedTestUsers(companyId)
}

seed().catch((err) => {
  console.error('❌ Failed to seed database:', err)
  process.exit(1)
})
