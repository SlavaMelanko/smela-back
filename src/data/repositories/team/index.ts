import {
  addTeamMember,
  createTeam,
  deleteTeam,
  removeTeamMember,
  updateTeam,
  updateTeamMember,
} from './mutations'
import {
  findTeamById,
  findTeamByName,
  findTeamMember,
  findTeamMembers,
  findTeamWithMembers,
  findUserTeam,
  searchTeams,
} from './queries'

export type { TeamSearchParams, TeamSearchResult } from './queries'

export * from './types'

export const teamRepo = {
  addMember: addTeamMember,
  create: createTeam,
  delete: deleteTeam,
  find: findTeamWithMembers,
  findById: findTeamById,
  findByName: findTeamByName,
  findMember: findTeamMember,
  findMembers: findTeamMembers,
  findUserTeam,
  removeMember: removeTeamMember,
  search: searchTeams,
  update: updateTeam,
  updateMember: updateTeamMember,
}
