import type { PermissionsInput } from '@/types'

import { authRepo, db, rbacRepo, tokenRepo, userRepo } from '@/data'
import env from '@/env'
import { AppError, ErrorCode } from '@/errors'
import { generatePasswordHash } from '@/security/password'
import { generateToken, TokenType } from '@/security/token'
import { emailAgent } from '@/services/email'
import { AuthProvider, Role, Status } from '@/types'

export interface InviteAdminInput {
  firstName: string
  lastName?: string
  email: string
  permissions: PermissionsInput
}

export const inviteAdmin = async (admin: InviteAdminInput, inviterId: string) => {
  const [existingUser, inviter] = await Promise.all([
    userRepo.findByEmail(admin.email),
    userRepo.findById(inviterId),
  ])

  if (existingUser) {
    throw new AppError(ErrorCode.EmailAlreadyInUse)
  }

  if (!inviter) {
    throw new AppError(ErrorCode.NotFound, 'Inviter not found')
  }

  const role = Role.Admin

  const { admin: newAdmin, token } = await db.transaction(async (tx) => {
    const newAdmin = await userRepo.create({
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      status: Status.Pending,
    }, tx)

    // Use random password and admin sets real password when accepting invitation
    const passwordHash = await generatePasswordHash()

    await authRepo.create({
      userId: newAdmin.id,
      provider: AuthProvider.Local,
      identifier: admin.email,
      passwordHash,
    }, tx)

    await rbacRepo.assignRole({
      userId: newAdmin.id,
      role,
      invitedBy: inviterId,
    }, tx)

    await rbacRepo.setUserPermissions(newAdmin.id, admin.permissions, tx)

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
    newAdmin.firstName,
    newAdmin.email,
    token,
    inviter.firstName,
    env.COMPANY_NAME,
  )

  return { admin: newAdmin }
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
