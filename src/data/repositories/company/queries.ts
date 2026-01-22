import { and, count, desc, eq, sql } from 'drizzle-orm'

import type { Database } from '../../clients'
import type { PaginatedResult, PaginationParams } from '../pagination'
import type { Company, CompanyMember, CompanyWithMembers, UserCompany, UserCompanyWithCompany } from './types'

import { db } from '../../clients'
import { companiesTable, userCompaniesTable, usersTable } from '../../schema'
import { calcOffset } from '../pagination'

export interface CompanySearchParams {
  search?: string
}

export interface CompanySearchResult {
  companies: Company[]
  pagination: PaginatedResult
}

export const searchCompanies = async (
  filters: CompanySearchParams,
  pagination: PaginationParams,
  tx?: Database,
): Promise<CompanySearchResult> => {
  const executor = tx || db
  const { search } = filters
  const { page, limit } = pagination
  const offset = calcOffset(pagination)

  const buildWhereConditions = () => {
    const conditions = []

    if (search && search.length > 0) {
      // Use concatenated expression to leverage GIN index (idx_companies_search_trgm)
      conditions.push(
        sql`(name || ' ' || COALESCE(website, '') || ' ' || COALESCE(description, '')) ILIKE ${`%${search}%`}`,
      )
    }

    return and(...conditions)
  }

  const whereClause = buildWhereConditions()

  const [countResult, companies] = await Promise.all([
    executor.select({ value: count() }).from(companiesTable).where(whereClause),
    executor
      .select()
      .from(companiesTable)
      .where(whereClause)
      .orderBy(desc(companiesTable.createdAt))
      .limit(limit)
      .offset(offset),
  ])

  const totalCount = countResult[0]?.value ?? 0

  return {
    companies,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  }
}

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

export const findCompany = async (
  companyId: string,
  tx?: Database,
): Promise<CompanyWithMembers | undefined> => {
  const executor = tx || db

  const [company] = await executor
    .select()
    .from(companiesTable)
    .where(eq(companiesTable.id, companyId))

  if (!company) {
    return undefined
  }

  const memberRows = await executor
    .select({
      id: userCompaniesTable.userId,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      email: usersTable.email,
      status: usersTable.status,
      position: userCompaniesTable.position,
      invitedBy: userCompaniesTable.invitedBy,
      joinedAt: userCompaniesTable.joinedAt,
    })
    .from(userCompaniesTable)
    .innerJoin(usersTable, eq(userCompaniesTable.userId, usersTable.id))
    .where(eq(userCompaniesTable.companyId, companyId))

  return {
    ...company,
    members: memberRows,
  }
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

  return executor
    .select({
      id: userCompaniesTable.userId,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      email: usersTable.email,
      status: usersTable.status,
      position: userCompaniesTable.position,
      invitedBy: userCompaniesTable.invitedBy,
      joinedAt: userCompaniesTable.joinedAt,
    })
    .from(userCompaniesTable)
    .innerJoin(usersTable, eq(userCompaniesTable.userId, usersTable.id))
    .where(eq(userCompaniesTable.companyId, companyId))
}
