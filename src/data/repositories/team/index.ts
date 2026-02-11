import {
  createTeam,
  createTeamMember,
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

const teamMutations = {
  create: createTeam,
  update: updateTeam,
}

const teamQueries = {
  find: findTeamWithMembers,
  findById: findTeamById,
  findByName: findTeamByName,
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
