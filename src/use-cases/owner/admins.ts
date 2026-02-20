import type { PaginationParams, SearchParams } from '@/data'
import type { Permissions } from '@/routes/@shared/permissions-schema'

import { authRepo, db, rbacRepo, tokenRepo, userRepo, userRoleRepo } from '@/data'
import env from '@/env'
import { AppError, ErrorCode } from '@/errors'
import { generatePasswordHash } from '@/security/password'
import { generateToken, TokenType } from '@/security/token'
import { emailAgent } from '@/services/email'
import { AuthProvider, Role, Status } from '@/types'

const normalizeRoles = (params: SearchParams): SearchParams => ({
  ...params,
  roles: [Role.Admin],
})

export const getAdmins = async (params: SearchParams, pagination: PaginationParams) => {
  const result = await userRepo.search(normalizeRoles(params), pagination)

  const adminIds = result.users.map(u => u.id)
  const inviters = await userRoleRepo.findInviters(adminIds)

  const admins = result.users.map(admin => ({
    ...admin,
    inviter: inviters.get(admin.id),
  }))

  return {
    data: { admins },
    pagination: result.pagination,
  }
}

export const getAdmin = async (adminId: string) => {
  const admin = await userRepo.findById(adminId)

  if (!admin || admin.role !== Role.Admin) {
    throw new AppError(ErrorCode.NotFound, 'Admin not found')
  }

  const inviters = await userRoleRepo.findInviters([adminId])

  return {
    admin: {
      ...admin,
      inviter: inviters.get(adminId),
    },
  }
}

export interface AdminInvitationParams {
  firstName: string
  lastName?: string
  email: string
  permissions: Permissions
}

export const inviteAdmin = async (params: AdminInvitationParams, inviterId: string) => {
  const [existingUser, inviter] = await Promise.all([
    userRepo.findByEmail(params.email),
    userRepo.findById(inviterId),
  ])

  if (existingUser) {
    throw new AppError(ErrorCode.EmailAlreadyInUse)
  }

  if (!inviter) {
    throw new AppError(ErrorCode.NotFound, 'Inviter not found')
  }

  const role = Role.Admin

  const { admin, token } = await db.transaction(async (tx) => {
    const newAdmin = await userRepo.create({
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.email,
      status: Status.Pending,
    }, tx)

    // Use random password and admin sets real password when accepting invitation
    const passwordHash = await generatePasswordHash()

    await authRepo.create({
      userId: newAdmin.id,
      provider: AuthProvider.Local,
      identifier: params.email,
      passwordHash,
    }, tx)

    await userRoleRepo.assign({
      userId: newAdmin.id,
      role,
      invitedBy: inviterId,
    }, tx)

    await rbacRepo.setUserPermissions(newAdmin.id, role, params.permissions, tx)

    const { type, token, expiresAt } = generateToken(TokenType.UserInvite)

    await tokenRepo.issue(newAdmin.id, {
      userId: newAdmin.id,
      type,
      token,
      expiresAt,
    }, tx)

    return { admin: { ...newAdmin, role }, token }
  })

  await emailAgent.sendUserInvitationEmail(
    admin.firstName,
    admin.email,
    token,
    inviter.firstName,
    env.COMPANY_NAME,
  )

  return { admin }
}

export const resendAdminInvite = async (adminId: string, inviterId: string) => {
  const [admin, inviter] = await Promise.all([
    userRepo.findById(adminId),
    userRepo.findById(inviterId),
  ])

  if (!admin || admin.role !== Role.Admin) {
    throw new AppError(ErrorCode.NotFound, 'Admin not found')
  }

  if (admin.status !== Status.Pending) {
    throw new AppError(ErrorCode.BadRequest, 'Admin has already accepted invitation')
  }

  if (!inviter) {
    throw new AppError(ErrorCode.NotFound, 'Inviter not found')
  }

  const token = await db.transaction(async (tx) => {
    const { type, token, expiresAt } = generateToken(TokenType.UserInvite)
    await tokenRepo.issue(adminId, { userId: adminId, type, token, expiresAt }, tx)

    return token
  })

  await emailAgent.sendUserInvitationEmail(
    admin.firstName,
    admin.email,
    token,
    inviter.firstName,
    env.COMPANY_NAME,
  )

  return { success: true }
}

export const cancelAdminInvite = async (adminId: string) => {
  const admin = await userRepo.findById(adminId)

  if (!admin || admin.role !== Role.Admin) {
    throw new AppError(ErrorCode.NotFound, 'Admin not found')
  }

  if (admin.status !== Status.Pending) {
    throw new AppError(ErrorCode.BadRequest, 'Admin has already accepted invitation')
  }

  await db.transaction(async (tx) => {
    await tokenRepo.deprecate(adminId, TokenType.UserInvite, tx)
    await userRepo.update(adminId, { status: Status.Archived }, tx)
  })

  return { success: true }
}
