import {
  createTeam,
  createTeamMember,
  deleteTeamMember,
  updateTeam,
  updateTeamMember,
} from './mutations'
import {
  findTeamById,
  findTeamMember,
  findTeamMembers,
  findTeamWithMemberCount,
  findUserTeam,
  searchTeams,
} from './queries'

export * from './types'

const teamMutations = {
  create: createTeam,
  update: updateTeam,
}

const teamQueries = {
  find: findTeamWithMemberCount,
  findById: findTeamById,
  findUserTeam,
  search: searchTeams,
}

const memberMutations = {
  createMember: createTeamMember,
  deleteMember: deleteTeamMember,
  updateMember: updateTeamMember,
}

const memberQueries = {
  findMember: findTeamMember,
  findMembers: findTeamMembers,
}

export const teamRepo = {
  ...teamMutations,
  ...teamQueries,
  ...memberMutations,
  ...memberQueries,
}
