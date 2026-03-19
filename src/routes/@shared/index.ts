import { z } from 'zod'

import { captchaRules } from './captcha-rules'
import { dataRules } from './data-rules'
import { paginationRules } from './pagination-rules'
import { preferencesRules } from './preferences-rules'
import { teamRules } from './team-rules'
import { userFilterRules } from './user-filter-rules'

export {
  type InviteMemberBody,
  inviteMemberBodySchema,
  type InviteMemberCtx,
  type TeamParams as TeamInvitesParams,
  teamParamsSchema as teamInvitesParamsSchema,
} from './team-invites-schema'

export {
  type CreateTeamBody,
  createTeamBodySchema,
  type CreateTeamCtx,
  type GetTeamsCtx,
  type GetTeamsQuery,
  getTeamsQuerySchema,
  type TeamParams,
  type TeamParamsCtx,
  teamParamsSchema,
  type UpdateTeamBody,
  updateTeamBodySchema,
  type UpdateTeamCtx,
} from './team-schema'

export const requestValidationRules = {
  captcha: captchaRules,
  team: teamRules,
  data: dataRules,
  pagination: paginationRules,
  preferences: preferencesRules,
  userFilter: userFilterRules,
}

export const nestedSchemas = {
  captcha: z.object({
    token: captchaRules.token,
  }),
  preferences: z.object({
    locale: preferencesRules.locale,
    theme: preferencesRules.theme,
  }),
}
