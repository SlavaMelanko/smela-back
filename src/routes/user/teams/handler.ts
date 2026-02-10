import { HttpStatus } from '@/net/http'
import { getTeam, updateTeam } from '@/use-cases/user'

import type { TeamParamsCtx, UpdateTeamCtx } from './schema'

// /teams/:teamId
export const getTeamHandler = async (c: TeamParamsCtx) => {
  const { teamId } = c.req.valid('param')
  const { id: userId } = c.get('user')

  const result = await getTeam(teamId, userId)

  return c.json(result, HttpStatus.OK)
}

export const updateTeamHandler = async (c: UpdateTeamCtx) => {
  const { teamId } = c.req.valid('param')
  const body = c.req.valid('json')
  const { id: userId } = c.get('user')

  const result = await updateTeam(teamId, body, userId)

  return c.json(result, HttpStatus.OK)
}
