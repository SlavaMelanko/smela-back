import { teamRepo, tokenRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { TokenType, TokenValidator } from '@/security/token'

interface CheckInviteResult {
  teamName: string
}

const checkInvite = async (token: string): Promise<CheckInviteResult> => {
  const tokenRecord = await tokenRepo.findByToken(token)

  const validatedToken = TokenValidator.validate(tokenRecord, TokenType.UserInvite)

  const userTeams = await teamRepo.findUserTeams(validatedToken.userId)

  if (userTeams.length === 0) {
    throw new AppError(ErrorCode.InternalError, 'User has no team membership')
  }

  const { team } = userTeams[0]

  return { teamName: team.name }
}

export default checkInvite
