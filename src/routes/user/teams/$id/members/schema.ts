import { z } from 'zod'

import type { ValidatedParamCtx, ValidatedParamJsonCtx } from '@/routes/validated-ctx'

import { rules } from '@/routes/rules'

export const teamIdParamsSchema = z.object({
  teamId: rules.team.id,
})

export type TeamIdParams = z.infer<typeof teamIdParamsSchema>
export type TeamIdCtx = ValidatedParamCtx<TeamIdParams>

export const inviteMemberBodySchema = z.object({
  firstName: rules.user.firstName,
  lastName: rules.user.lastName.optional(),
  email: rules.user.email,
  position: rules.team.position.optional(),
  permissions: rules.permissions,
}).strict()

export type InviteMemberBody = z.infer<typeof inviteMemberBodySchema>
export type InviteMemberCtx = ValidatedParamJsonCtx<TeamIdParams, InviteMemberBody>
