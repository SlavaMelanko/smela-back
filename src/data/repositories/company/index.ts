import {
  addUserToCompany,
  createCompany,
  deleteCompany,
  removeUserFromCompany,
  updateCompany,
} from './mutations'
import {
  findCompanyById,
  findCompanyByName,
  findCompanyMembers,
  findUserCompanies,
  findUserCompany,
} from './queries'

export * from './types'

export const companyRepo = {
  addUser: addUserToCompany,
  create: createCompany,
  delete: deleteCompany,
  findById: findCompanyById,
  findByName: findCompanyByName,
  findMembers: findCompanyMembers,
  findUserCompanies,
  findUserCompany,
  removeUser: removeUserFromCompany,
  update: updateCompany,
}
