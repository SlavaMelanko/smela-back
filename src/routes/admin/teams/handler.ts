import { HttpStatus } from '@/net/http'
import { createTeam, getTeams } from '@/use-cases/admin'

import type { CreateTeamCtx, GetTeamsCtx } from './schema'

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
