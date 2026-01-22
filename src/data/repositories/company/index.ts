import {
  addUserToCompany,
  createCompany,
  deleteCompany,
  removeUserFromCompany,
  updateCompany,
} from './mutations'
import {
  findCompany,
  findCompanyById,
  findCompanyByName,
  findCompanyMembers,
  findUserCompanies,
  findUserCompany,
  searchCompanies,
} from './queries'

export type { CompanySearchParams, CompanySearchResult } from './queries'

export * from './types'

export const companyRepo = {
  addUser: addUserToCompany,
  create: createCompany,
  delete: deleteCompany,
  find: findCompany,
  findById: findCompanyById,
  findByName: findCompanyByName,
  findMembers: findCompanyMembers,
  findUserCompanies,
  findUserCompany,
  removeUser: removeUserFromCompany,
  search: searchCompanies,
  update: updateCompany,
}
