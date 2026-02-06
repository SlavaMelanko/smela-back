import { authRepo, companyRepo, db, tokenRepo, userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { generatePasswordHash } from '@/security/password'
import { generateToken, TokenType } from '@/security/token'
import { emailAgent } from '@/services/email'
import { AuthProvider, Role, Status } from '@/types'

export interface InviteMemberParams {
  firstName: string
  lastName?: string
  email: string
  position?: string
}

export const inviteMember = async (
  companyId: string,
  params: InviteMemberParams,
  invitedBy: string,
) => {
  const company = await companyRepo.findById(companyId)

  if (!company) {
    throw new AppError(ErrorCode.NotFound, 'Company not found')
  }

  const existingUser = await userRepo.findByEmail(params.email)

  if (existingUser) {
    throw new AppError(ErrorCode.EmailAlreadyInUse)
  }

  const { user, token } = await db.transaction(async (tx) => {
    const newUser = await userRepo.create({
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.email,
      status: Status.Pending,
    }, tx)

    // Use random password and user sets real password when accepting invitation
    const passwordHash = await generatePasswordHash()

    await authRepo.create({
      userId: newUser.id,
      provider: AuthProvider.Local,
      identifier: params.email,
      passwordHash,
    }, tx)

    await companyRepo.addUser({
      userId: newUser.id,
      companyId,
      position: params.position,
      invitedBy,
    }, tx)

    const { type, token, expiresAt } = generateToken(TokenType.UserInvitation)

    await tokenRepo.issue(newUser.id, {
      userId: newUser.id,
      type,
      token,
      expiresAt,
    }, tx)

    return {
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        status: newUser.status,
        role: Role.User,
      },
      token,
    }
  })

  await emailAgent.sendUserInvitationEmail(
    user.firstName,
    user.email,
    token,
    company.name,
  )

  return { user }
}
