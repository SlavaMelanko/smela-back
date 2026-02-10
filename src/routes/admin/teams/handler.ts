import { HttpStatus } from '@/net/http'
import {
  createTeam,
  getTeam,
  getTeams,
  updateTeam,
} from '@/use-cases/user'

import type {
  CreateTeamCtx,
  GetTeamsCtx,
  TeamParamsCtx,
  UpdateTeamCtx,
} from './schema'

// /teams
export const getTeamsHandler = async (c: GetTeamsCtx) => {
  const { search, page, limit } = c.req.valid('query')

  const filters = { search }
  const pagination = { page, limit }
  const result = await getTeams(filters, pagination)

  return c.json(result, HttpStatus.OK)
}

export const createTeamHandler = async (c: CreateTeamCtx) => {
  const body = c.req.valid('json')

  const result = await createTeam(body)

  return c.json(result, HttpStatus.CREATED)
}

// /teams/:teamId
export const getTeamHandler = async (c: TeamParamsCtx) => {
  const { teamId } = c.req.valid('param')

  const result = await getTeam(teamId)

  return c.json(result, HttpStatus.OK)
}

export const updateTeamHandler = async (c: UpdateTeamCtx) => {
  const { teamId } = c.req.valid('param')
  const body = c.req.valid('json')

  const result = await updateTeam(teamId, body)

  return c.json(result, HttpStatus.OK)
}
