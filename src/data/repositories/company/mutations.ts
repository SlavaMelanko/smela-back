import { and, eq } from 'drizzle-orm'

import { AppError, ErrorCode } from '@/errors'

import type { Database } from '../../clients'
import type {
  Company,
  CreateCompanyInput,
  CreateUserCompanyInput,
  UpdateCompanyInput,
  UserCompany,
} from './types'

import { db } from '../../clients'
import { companiesTable, userCompaniesTable } from '../../schema'

export const createCompany = async (
  input: CreateCompanyInput,
  tx?: Database,
): Promise<Company> => {
  const executor = tx || db

  const [company] = await executor
    .insert(companiesTable)
    .values(input)
    .returning()

  if (!company) {
    throw new AppError(ErrorCode.InternalError, 'Failed to create company')
  }

  return company
}

export const updateCompany = async (
  companyId: string,
  updates: UpdateCompanyInput,
  tx?: Database,
): Promise<Company> => {
  const executor = tx || db

  const [company] = await executor
    .update(companiesTable)
    .set(updates)
    .where(eq(companiesTable.id, companyId))
    .returning()

  if (!company) {
    throw new AppError(ErrorCode.InternalError, 'Failed to update company')
  }

  return company
}

export const deleteCompany = async (
  companyId: string,
  tx?: Database,
): Promise<void> => {
  const executor = tx || db

  await executor
    .delete(companiesTable)
    .where(eq(companiesTable.id, companyId))
}

export const addUserToCompany = async (
  input: CreateUserCompanyInput,
  tx?: Database,
): Promise<UserCompany> => {
  const executor = tx || db

  const [membership] = await executor
    .insert(userCompaniesTable)
    .values(input)
    .returning()

  if (!membership) {
    throw new AppError(ErrorCode.InternalError, 'Failed to add user to company')
  }

  return membership
}

export const removeUserFromCompany = async (
  userId: string,
  companyId: string,
  tx?: Database,
): Promise<void> => {
  const executor = tx || db

  await executor
    .delete(userCompaniesTable)
    .where(
      and(
        eq(userCompaniesTable.userId, userId),
        eq(userCompaniesTable.companyId, companyId),
      ),
    )
}
