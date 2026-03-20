/* eslint-disable no-console */

/**
 * Seed initial data required to start the application
 *
 * Seeds: permissions, initial users (owner, admin, test users) with direct user permissions
 *
 * Usage:
 *   bun run db:seed
 */

import { faker } from '@faker-js/faker'
import { eq } from 'drizzle-orm'

import { hashPassword } from '@/security/password'
import { Action, AuthProvider, Resource, Role, Status } from '@/types'

import { db } from '../clients'
import { authTable, permissionsTable, teamMembersTable, teamsTable, userPermissionsTable, userRoleTable, usersTable } from '../schema'

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

const setUserPermissions = async (
  userId: string,
  permissions: { action: Action, resource: Resource }[],
) => {
  const allPermissions = await db.select().from(permissionsTable)

  const toInsert = permissions
    .map(({ action, resource }) => {
      const perm = allPermissions.find(p => p.action === action && p.resource === resource)

      return perm ? { userId, permissionId: perm.id } : null
    })
    .filter(Boolean) as { userId: string, permissionId: number }[]

  if (toInsert.length > 0) {
    await db
      .insert(userPermissionsTable)
      .values(toInsert)
      .onConflictDoNothing()
  }
}

const seedTeams = async () => {
  const teams = [
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

  let secondTeamId: string | null = null

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i]

    const [existingTeam] = await db
      .select()
      .from(teamsTable)
      .where(eq(teamsTable.name, team.name))

    if (existingTeam) {
      console.log(`✅ ${team.name} team already exists`)
      if (i === 1) {
        secondTeamId = existingTeam.id
      }
      continue
    }

    const [createdTeam] = await db.insert(teamsTable).values({
      name: team.name,
      website: team.website,
      description: team.description,
    }).returning({ id: teamsTable.id })

    console.log(`✅ ${team.name} team seeded`)

    if (i === 1) {
      secondTeamId = createdTeam.id
    }
  }

  return secondTeamId!
}

// System users (Owner, Admin) - no team linking
const seedSystemUsers = async () => {
  const systemUsers: {
    firstName: string
    lastName: string
    email: string
    password: string
    role: Role
    status: Status
    permissions: { action: Action, resource: Resource }[]
  }[] = [
    {
      firstName: 'Slava',
      lastName: 'Owner',
      email: 'owner@smela.me',
      password: 'Passw0rd!',
      role: Role.Owner,
      status: Status.Active,
      permissions: [
        { action: Action.Manage, resource: Resource.Admins },
        { action: Action.Manage, resource: Resource.Users },
        { action: Action.Manage, resource: Resource.Teams },
      ],
    },
    {
      firstName: 'Slava',
      lastName: 'Admin',
      email: 'admin@smela.me',
      password: 'Passw0rd!',
      role: Role.Admin,
      status: Status.Active,
      permissions: [
        { action: Action.Manage, resource: Resource.Users },
        { action: Action.Manage, resource: Resource.Teams },
      ],
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

    await db.insert(userRoleTable).values({
      userId: createdUser.id,
      role: user.role,
    })

    await setUserPermissions(createdUser.id, user.permissions)

    console.log(`✅ ${user.role} ${user.email} seeded`)
  }
}

// Test users (User role) - linked to team
const seedTestUsers = async (teamId: string) => {
  const testUsers = [
    {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: 'alyce96@gmail.com', // Use a consistent email for testing
      password: 'Passw0rd!',
      status: Status.Active,
      position: 'Developer',
      permissions: [
        { action: Action.Manage, resource: Resource.Users },
        { action: Action.Manage, resource: Resource.Teams },
      ],
    },
    {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email().toLowerCase(),
      password: 'Passw0rd!',
      status: Status.Pending,
      position: 'Designer',
      permissions: [
        { action: Action.View, resource: Resource.Users },
        { action: Action.View, resource: Resource.Teams },
      ],
    },
  ]

  for (const user of testUsers) {
    const [existingUser] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, user.email))

    if (existingUser) {
      // Ensure user is linked to team
      const [existingLink] = await db
        .select()
        .from(teamMembersTable)
        .where(eq(teamMembersTable.userId, existingUser.id))

      if (!existingLink) {
        await db.insert(teamMembersTable).values({
          userId: existingUser.id,
          teamId,
          position: user.position,
        })
        console.log(`✅ Linked ${user.email} to team as ${user.position}`)
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

    await db.insert(teamMembersTable).values({
      userId: createdUser.id,
      teamId,
      position: user.position,
    })

    await setUserPermissions(createdUser.id, user.permissions)

    console.log(`✅ user ${user.email} seeded and linked to team`)
  }
}

const seed = async () => {
  await seedPermissions()
  await seedSystemUsers()
  const teamId = await seedTeams()
  await seedTestUsers(teamId)
}

seed().catch((err) => {
  console.error('❌ Failed to seed database:', err)
  process.exit(1)
})
