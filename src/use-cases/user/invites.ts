import type { PermissionsInput } from '@/types'

import { authRepo, db, rbacRepo, teamRepo, tokenRepo, userRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { generatePasswordHash } from '@/security/password'
import { generateToken, TokenType } from '@/security/token'
import { emailAgent } from '@/services/email'
import { AuthProvider, Status } from '@/types'

export interface InviteMemberInput {
  firstName: string
  lastName?: string
  email: string
  position?: string
  permissions: PermissionsInput
}

export const inviteMember = async (
  teamId: string,
  member: InviteMemberInput,
  inviterId: string,
) => {
  const [inviter, team, existingUser] = await Promise.all([
    userRepo.findById(inviterId),
    teamRepo.findById(teamId),
    userRepo.findByEmail(member.email),
  ])

  if (!inviter) {
    throw new AppError(ErrorCode.NotFound, 'Inviter not found')
  }

  if (!team) {
    throw new AppError(ErrorCode.NotFound, 'Team not found')
  }

  if (existingUser) {
    throw new AppError(ErrorCode.EmailAlreadyInUse)
  }

  const { member: newMember, token } = await db.transaction(async (tx) => {
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

    await teamRepo.createMember({
      userId: newUser.id,
      teamId,
      position: member.position,
      invitedBy: inviterId,
    }, tx)

    await rbacRepo.setUserPermissions(newUser.id, member.permissions, tx)

    const { type, token, expiresAt } = generateToken(TokenType.UserInvite)

    await tokenRepo.issue(newUser.id, {
      userId: newUser.id,
      type,
      token,
      expiresAt,
    }, tx)

    return {
      member: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        status: newUser.status,
        position: member.position ?? null,
        invitedBy: inviterId,
        joinedAt: newUser.createdAt,
      },
      token,
    }
  })

  await emailAgent.sendUserInvitationEmail(
    newMember.firstName,
    newMember.email,
    token,
    inviter.firstName,
    team.name,
  )

  return { member: newMember }
}

export const resendMemberInvite = async (
  teamId: string,
  memberId: string,
  inviterId: string,
) => {
  const [inviter, team, member, membership] = await Promise.all([
    userRepo.findById(inviterId),
    teamRepo.findById(teamId),
    userRepo.findById(memberId),
    teamRepo.findMember(teamId, memberId),
  ])

  if (!inviter) {
    throw new AppError(ErrorCode.NotFound, 'Inviter not found')
  }

  if (!team) {
    throw new AppError(ErrorCode.NotFound, 'Team not found')
  }

  if (!member) {
    throw new AppError(ErrorCode.NotFound, 'Member not found')
  }

  if (!membership) {
    throw new AppError(ErrorCode.NotFound, 'Member not found in this team')
  }

  if (member.status !== Status.Pending) {
    throw new AppError(ErrorCode.BadRequest, 'Member has already accepted invitation')
  }

  const token = await db.transaction(async (tx) => {
    const { type, token, expiresAt } = generateToken(TokenType.UserInvite)
    await tokenRepo.issue(memberId, { userId: memberId, type, token, expiresAt }, tx)

    return token
  })

  await emailAgent.sendUserInvitationEmail(
    member.firstName,
    member.email,
    token,
    inviter.firstName,
    team.name,
  )

  return { success: true }
}

export const cancelMemberInvite = async (teamId: string, memberId: string) => {
  const [member, membership] = await Promise.all([
    userRepo.findById(memberId),
    teamRepo.findMember(teamId, memberId),
  ])

  if (!member || !membership) {
    throw new AppError(ErrorCode.NotFound, 'Member not found')
  }

  if (member.status !== Status.Pending) {
    throw new AppError(ErrorCode.BadRequest, 'Member has already accepted invitation')
  }

  await db.transaction(async (tx) => {
    await tokenRepo.deprecate(memberId, TokenType.UserInvite, tx)
    await userRepo.update(memberId, { status: Status.Archived }, tx)
  })

  return { success: true }
}
