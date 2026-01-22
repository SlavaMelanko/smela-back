import type { companiesTable, userCompaniesTable } from '../../schema'

export type CompanyRecord = typeof companiesTable.$inferSelect
export type UserCompanyRecord = typeof userCompaniesTable.$inferSelect

export type CreateCompanyInput = typeof companiesTable.$inferInsert
export type UpdateCompanyInput = Partial<Omit<CreateCompanyInput, 'id' | 'createdAt'>>

export type CreateUserCompanyInput = typeof userCompaniesTable.$inferInsert

export type Company = CompanyRecord
export type UserCompany = UserCompanyRecord

export interface CompanyMember {
  id: string
  firstName: string
  lastName: string | null
  email: string
  status: string
  position: string | null
  invitedBy: string | null
  joinedAt: Date | null
}

export type CompanyWithMembers = Company & {
  members: CompanyMember[]
}

export type UserCompanyWithCompany = UserCompany & {
  company: Company
}
