import type { companiesTable, userCompaniesTable } from '../../schema'

export type CompanyRecord = typeof companiesTable.$inferSelect
export type UserCompanyRecord = typeof userCompaniesTable.$inferSelect

export type CreateCompanyInput = typeof companiesTable.$inferInsert
export type UpdateCompanyInput = Partial<Omit<CreateCompanyInput, 'id' | 'createdAt'>>

export type CreateUserCompanyInput = typeof userCompaniesTable.$inferInsert

export type Company = CompanyRecord
export type UserCompany = UserCompanyRecord

export type CompanyMember = UserCompany & {
  user: {
    id: string
    firstName: string
    lastName: string | null
    email: string
  }
}

export type UserCompanyWithCompany = UserCompany & {
  company: Company
}
