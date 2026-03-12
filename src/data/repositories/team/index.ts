import {
  createTeam,
  createTeamMember,
  updateTeam,
  updateTeamMember,
} from './mutations'
import {
  findSharedTeam,
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
  findSharedTeam,
  findUserTeam,
  search: searchTeams,
}

const memberMutations = {
  createMember: createTeamMember,
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
