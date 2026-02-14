import { HttpStatus } from '@/net/http'
import { getTeam, updateTeam } from '@/use-cases/user'

import type { TeamParamsCtx, UpdateTeamCtx } from './schema'

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
