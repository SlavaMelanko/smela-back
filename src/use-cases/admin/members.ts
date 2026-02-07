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
  member: InviteMemberParams,
  inviterId: string,
) => {
  const [company, inviter, existingUser] = await Promise.all([
    companyRepo.findById(companyId),
    userRepo.findById(inviterId),
    userRepo.findByEmail(member.email),
  ])

  if (!company) {
    throw new AppError(ErrorCode.NotFound, 'Company not found')
  }

  if (!inviter) {
    throw new AppError(ErrorCode.NotFound, 'Inviter not found')
  }

  if (existingUser) {
    throw new AppError(ErrorCode.EmailAlreadyInUse)
  }

  const { user, token } = await db.transaction(async (tx) => {
    const newUser = await userRepo.create({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      status: Status.Pending,
    }, tx)

    // Use random password and user sets real password when accepting invitation
    const passwordHash = await generatePasswordHash()

    await authRepo.create({
      userId: newUser.id,
      provider: AuthProvider.Local,
      identifier: member.email,
      passwordHash,
    }, tx)

    await companyRepo.addUser({
      userId: newUser.id,
      companyId,
      position: member.position,
      invitedBy: inviterId,
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
    inviter.firstName,
    company.name,
  )

  return { user }
}

export const resendMemberInvitation = async (
  companyId: string,
  memberId: string,
  inviterId: string,
) => {
  const [company, member, membership, inviter] = await Promise.all([
    companyRepo.findById(companyId),
    userRepo.findById(memberId),
    companyRepo.findUserCompany(memberId, companyId),
    userRepo.findById(inviterId),
  ])

  if (!company) {
    throw new AppError(ErrorCode.NotFound, 'Company not found')
  }

  if (!member) {
    throw new AppError(ErrorCode.NotFound, 'Member not found')
  }

  if (!membership) {
    throw new AppError(ErrorCode.NotFound, 'Member not found in this company')
  }

  if (member.status !== Status.Pending) {
    throw new AppError(ErrorCode.BadRequest, 'Member has already accepted invitation')
  }

  if (!inviter) {
    throw new AppError(ErrorCode.NotFound, 'Inviter not found')
  }

  const token = await db.transaction(async (tx) => {
    const { type, token, expiresAt } = generateToken(TokenType.UserInvitation)
    await tokenRepo.issue(memberId, { userId: memberId, type, token, expiresAt }, tx)

    return token
  })

  await emailAgent.sendUserInvitationEmail(
    member.firstName,
    member.email,
    token,
    inviter.firstName,
    company.name,
  )

  return { success: true }
}
