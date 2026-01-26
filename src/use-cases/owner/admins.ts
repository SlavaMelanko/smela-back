import type { PaginationParams, SearchParams } from '@/data'

import { createRandomBytesGenerator } from '@/crypto'
import { authRepo, db, tokenRepo, userRepo } from '@/data'
import env from '@/env'
import { AppError, ErrorCode } from '@/errors'
import { hashPassword } from '@/security/password'
import { generateToken, TokenType } from '@/security/token'
import { emailAgent } from '@/services/email'
import { AuthProvider, Role, Status } from '@/types'

const normalizeRoles = (params: SearchParams): SearchParams => ({
  ...params,
  roles: [Role.Admin],
})

export const getAdmins = async (params: SearchParams, pagination: PaginationParams) => {
  const result = await userRepo.search(normalizeRoles(params), pagination)

  return {
    data: { admins: result.users },
    pagination: result.pagination,
  }
}

export const getAdmin = async (adminId: string) => {
  const admin = await userRepo.findById(adminId)

  if (!admin || admin.role !== Role.Admin) {
    throw new AppError(ErrorCode.NotFound, 'Admin not found')
  }

  return { admin }
}

export interface AdminInvitationParams {
  firstName: string
  lastName?: string
  email: string
  permissions: {
    view: boolean
    edit: boolean
    create: boolean
    delete: boolean
  }
}

export const inviteAdmin = async (params: AdminInvitationParams) => {
  const existingUser = await userRepo.findByEmail(params.email)

  if (existingUser) {
    throw new AppError(ErrorCode.EmailAlreadyInUse)
  }

  const { admin, token } = await db.transaction(async (tx) => {
    const newAdmin = await userRepo.create({
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.email,
      role: Role.Admin,
      status: Status.Pending,
    }, tx)

    // Placeholder hash - admin sets real password when accepting invitation
    const randomBytesGenerator = createRandomBytesGenerator()
    const placeholderPassword = randomBytesGenerator.generate(32)
    const placeholderHash = await hashPassword(placeholderPassword)

    await authRepo.create({
      userId: newAdmin.id,
      provider: AuthProvider.Local,
      identifier: params.email,
      passwordHash: placeholderHash,
    }, tx)

    const { type, token, expiresAt } = generateToken(TokenType.UserInvitation)

    await tokenRepo.issue(newAdmin.id, {
      userId: newAdmin.id,
      type,
      token,
      expiresAt,
    }, tx)

    return { admin: newAdmin, token }
  })

  await emailAgent.sendUserInvitationEmail(
    admin.firstName,
    admin.email,
    token,
    env.COMPANY_NAME,
  )

  return { admin }
}

export const resendAdminInvitation = async (adminId: string) => {
  const admin = await userRepo.findById(adminId)

  if (!admin || admin.role !== Role.Admin) {
    throw new AppError(ErrorCode.NotFound, 'Admin not found')
  }

  if (admin.status !== Status.Pending) {
    throw new AppError(ErrorCode.BadRequest, 'Admin has already accepted invitation')
  }

  const token = await db.transaction(async (tx) => {
    const { type, token, expiresAt } = generateToken(TokenType.UserInvitation)
    await tokenRepo.issue(adminId, { userId: adminId, type, token, expiresAt }, tx)

    return token
  })

  await emailAgent.sendUserInvitationEmail(
    admin.firstName,
    admin.email,
    token,
    env.COMPANY_NAME,
  )

  return { success: true }
}
