import {
  addUserToCompany,
  createCompany,
  deleteCompany,
  removeUserFromCompany,
  updateCompany,
} from './mutations'
import {
  findAllCompanies,
  findCompanyById,
  findCompanyByName,
  findCompanyMembers,
  findCompanyWithMembers,
  findUserCompanies,
  findUserCompany,
} from './queries'

export type { CompanySearchParams, CompanySearchResult } from './queries'

export * from './types'

export const companyRepo = {
  addUser: addUserToCompany,
  create: createCompany,
  delete: deleteCompany,
  findAll: findAllCompanies,
  findById: findCompanyById,
  findByName: findCompanyByName,
  findMembers: findCompanyMembers,
  findWithMembers: findCompanyWithMembers,
  findUserCompanies,
  findUserCompany,
  removeUser: removeUserFromCompany,
  update: updateCompany,
}
