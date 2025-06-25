import { eq } from 'drizzle-orm'

import db from '@/db'
import { rolesTable } from '@/db/schema'

const getIdByName = async (name: string) => {
  const [role] = await db
    .select()
    .from(rolesTable)
    .where(eq(rolesTable.name, name))

  return role?.id ?? null
}

const getNameById = async (id: number) => {
  const [role] = await db
    .select()
    .from(rolesTable)
    .where(eq(rolesTable.id, id))

  return role?.name ?? null
}

export { getIdByName, getNameById }
