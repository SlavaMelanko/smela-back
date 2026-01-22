import { and, eq } from 'drizzle-orm'

import type { Database } from '../../clients'
import type { Company, CompanyMember, UserCompany, UserCompanyWithCompany } from './types'

import { db } from '../../clients'
import { companiesTable, userCompaniesTable, usersTable } from '../../schema'

export const findCompanyById = async (
  companyId: string,
  tx?: Database,
): Promise<Company | undefined> => {
  const executor = tx || db

  const [company] = await executor
    .select()
    .from(companiesTable)
    .where(eq(companiesTable.id, companyId))

  return company
}

export const findCompanyByName = async (
  name: string,
  tx?: Database,
): Promise<Company | undefined> => {
  const executor = tx || db

  const [company] = await executor
    .select()
    .from(companiesTable)
    .where(eq(companiesTable.name, name))

  return company
}

export const findUserCompany = async (
  userId: string,
  companyId: string,
  tx?: Database,
): Promise<UserCompany | undefined> => {
  const executor = tx || db

  const [membership] = await executor
    .select()
    .from(userCompaniesTable)
    .where(
      and(
        eq(userCompaniesTable.userId, userId),
        eq(userCompaniesTable.companyId, companyId),
      ),
    )

  return membership
}

export const findUserCompanies = async (
  userId: string,
  tx?: Database,
): Promise<UserCompanyWithCompany[]> => {
  const executor = tx || db

  const results = await executor
    .select({
      id: userCompaniesTable.id,
      userId: userCompaniesTable.userId,
      companyId: userCompaniesTable.companyId,
      position: userCompaniesTable.position,
      invitedBy: userCompaniesTable.invitedBy,
      joinedAt: userCompaniesTable.joinedAt,
      company: companiesTable,
    })
    .from(userCompaniesTable)
    .innerJoin(companiesTable, eq(userCompaniesTable.companyId, companiesTable.id))
    .where(eq(userCompaniesTable.userId, userId))

  return results.map(row => ({
    id: row.id,
    userId: row.userId,
    companyId: row.companyId,
    position: row.position,
    invitedBy: row.invitedBy,
    joinedAt: row.joinedAt,
    company: row.company,
  }))
}

export const findCompanyMembers = async (
  companyId: string,
  tx?: Database,
): Promise<CompanyMember[]> => {
  const executor = tx || db

  const results = await executor
    .select({
      id: userCompaniesTable.id,
      userId: userCompaniesTable.userId,
      companyId: userCompaniesTable.companyId,
      position: userCompaniesTable.position,
      invitedBy: userCompaniesTable.invitedBy,
      joinedAt: userCompaniesTable.joinedAt,
      user: {
        id: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        email: usersTable.email,
      },
    })
    .from(userCompaniesTable)
    .innerJoin(usersTable, eq(userCompaniesTable.userId, usersTable.id))
    .where(eq(userCompaniesTable.companyId, companyId))

  return results.map(row => ({
    id: row.id,
    userId: row.userId,
    companyId: row.companyId,
    position: row.position,
    invitedBy: row.invitedBy,
    joinedAt: row.joinedAt,
    user: row.user,
  }))
}
