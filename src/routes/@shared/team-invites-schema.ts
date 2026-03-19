import { z } from 'zod'

import type { ValidatedParamJsonCtx } from '../validated-ctx'

import { rules } from '../rules'

export const teamParamsSchema = z.object({
  teamId: rules.user.id,
})

export const inviteMemberBodySchema = z.object({
  firstName: rules.user.firstName,
  lastName: rules.user.lastName.optional(),
  email: rules.user.email,
  position: rules.team.position.optional(),
  permissions: rules.permissions,
})

export type TeamParams = z.infer<typeof teamParamsSchema>
export type InviteMemberBody = z.infer<typeof inviteMemberBodySchema>
export type InviteMemberCtx = ValidatedParamJsonCtx<TeamParams, InviteMemberBody>
