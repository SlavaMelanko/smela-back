import { eq, isNull } from 'drizzle-orm'

import { createPasswordEncoder } from '@/lib/crypto'

import db from './db'
import { actionTypeEnum, permissionsTable, resourcesTable, rolePermissionsTable, rolesTable, usersTable } from './schema'

const seedRoles = async () => {
  const rolesToSeed = [
    { name: 'owner' },
    { name: 'admin' },
    { name: 'enteprise_user' },
    { name: 'selfserve_user' },
  ]

  const existingRoles = await db.select().from(rolesTable)
  const rolesToInsert = rolesToSeed.filter(
    role => !existingRoles.some(existing => existing.name === role.name),
  )

  if (rolesToInsert.length > 0) {
    await db.insert(rolesTable).values(rolesToInsert)
    // eslint-disable-next-line no-console
    console.log(`✅ ${rolesToInsert.length} roles seeded`)
  } else {
    // eslint-disable-next-line no-console
    console.log('✅ Roles already seeded')
  }
}

const seedResources = async () => {
  const resourcesToSeed = [{ name: 'users' }]

  const existingResources = await db.select().from(resourcesTable)
  const resourcesToInsert = resourcesToSeed.filter(
    resource => !existingResources.some(existing => existing.name === resource.name),
  )

  if (resourcesToInsert.length > 0) {
    await db.insert(resourcesTable).values(resourcesToInsert)
    // eslint-disable-next-line no-console
    console.log(`✅ ${resourcesToInsert.length} resources seeded`)
  } else {
    // eslint-disable-next-line no-console
    console.log('✅ Resources already seeded')
  }
}

const seedPermissions = async () => {
  const allResources = await db.select().from(resourcesTable)
  const allActions = actionTypeEnum.enumValues

  if (allResources.length === 0) {
    // eslint-disable-next-line no-console
    console.log('⚠️ No resources found, skipping permissions seeding.')

    return
  }

  const existingPermissions = await db.select().from(permissionsTable)
  const permissionsToInsert: {
    action: 'view' | 'create' | 'edit' | 'delete'
    resourceId: number
  }[] = []

  for (const resource of allResources) {
    for (const action of allActions) {
      const permissionExists = existingPermissions.some(
        p => p.resourceId === resource.id && p.action === action,
      )

      if (!permissionExists) {
        permissionsToInsert.push({
          resourceId: resource.id,
          action,
        })
      }
    }
  }

  if (permissionsToInsert.length > 0) {
    await db.insert(permissionsTable).values(permissionsToInsert)
    // eslint-disable-next-line no-console
    console.log(`✅ ${permissionsToInsert.length} permissions seeded`)
  } else {
    // eslint-disable-next-line no-console
    console.log('✅ Permissions already seeded')
  }
}

const seedRolePermissions = async () => {
  const [adminRole] = await db.select().from(rolesTable).where(eq(rolesTable.name, 'admin'))
  const [ownerRole] = await db.select().from(rolesTable).where(eq(rolesTable.name, 'owner'))
  const [usersResource] = await db
    .select()
    .from(resourcesTable)
    .where(eq(resourcesTable.name, 'users'))

  if (!adminRole || !ownerRole || !usersResource) {
    // eslint-disable-next-line no-console
    console.log('⚠️ Roles or resources not found, skipping role permission seeding.')

    return
  }

  const usersPermissions = await db
    .select()
    .from(permissionsTable)
    .where(eq(permissionsTable.resourceId, usersResource.id))

  const rolesToAssign = [adminRole, ownerRole]
  const permissionsToInsert: { roleId: number, permissionId: number }[] = []

  const existingRolePermissions = await db.select().from(rolePermissionsTable)

  for (const role of rolesToAssign) {
    for (const permission of usersPermissions) {
      const mappingExists = existingRolePermissions.some(
        rp => rp.roleId === role.id && rp.permissionId === permission.id,
      )
      if (!mappingExists) {
        permissionsToInsert.push({ roleId: role.id, permissionId: permission.id })
      }
    }
  }

  if (permissionsToInsert.length > 0) {
    await db.insert(rolePermissionsTable).values(permissionsToInsert)
    // eslint-disable-next-line no-console
    console.log(`✅ Seeded ${permissionsToInsert.length} role permissions.`)
  } else {
    // eslint-disable-next-line no-console
    console.log('✅ Role permissions already seeded or no permissions to seed.')
  }
}

const seedAdmins = async () => {
  const adminRole = await db.select().from(rolesTable).where(eq(rolesTable.name, 'admin')).then(rows => rows[0])
  const selfServeUserRole = await db.select().from(rolesTable).where(eq(rolesTable.name, 'selfserve_user')).then(rows => rows[0])

  if (!adminRole || !selfServeUserRole) {
    // eslint-disable-next-line no-console
    console.log('⚠️ Required roles not found, skipping admin user seeding.')

    return
  }

  // Set default role for existing users without one
  await db.update(usersTable).set({ roleId: selfServeUserRole.id }).where(isNull(usersTable.roleId))

  const adminUsers = [
    {
      firstName: 'Jason',
      lastName: 'Statham',
      email: 'jason.admin@example.com',
      password: 'Passw0rd!', // plain text for seeding; will be hashed
    },
    {
      firstName: 'Billy',
      lastName: 'Herrington',
      email: 'billy.admin@example.com',
      password: 'Passw0rd!',
    },
  ]

  for (const admin of adminUsers) {
    const [existingUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, admin.email))

    if (!existingUser) {
      const encoder = createPasswordEncoder()
      const hashedPassword = await encoder.hash(admin.password)

      await db.insert(usersTable).values([
        {
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          password: hashedPassword,
          roleId: adminRole.id,
        },
      ])
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
  await seedResources()
  await seedPermissions()
  await seedRolePermissions()
  await seedAdmins()
}

seed().catch((err) => {
  console.error('❌ Failed to seed database:', err)
  process.exit(1)
})
