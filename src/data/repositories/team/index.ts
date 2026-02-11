import {
  addTeamMember,
  createTeam,
  deleteTeam,
  removeTeamMember,
  updateTeam,
  updateTeamMember,
} from './mutations'
import {
  findTeam,
  findTeamById,
  findTeamByName,
  findTeamMember,
  findTeamMemberById,
  findTeamMembers,
  findUserTeam,
  searchTeams,
} from './queries'

export type { TeamSearchParams, TeamSearchResult } from './queries'

export * from './types'

export const teamRepo = {
  addMember: addTeamMember,
  create: createTeam,
  delete: deleteTeam,
  find: findTeam,
  findById: findTeamById,
  findByName: findTeamByName,
  findMember: findTeamMember,
  findMemberById: findTeamMemberById,
  findMembers: findTeamMembers,
  findUserTeam,
  removeMember: removeTeamMember,
  search: searchTeams,
  update: updateTeam,
  updateMember: updateTeamMember,
}
