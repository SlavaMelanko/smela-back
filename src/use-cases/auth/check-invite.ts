import { companyRepo, tokenRepo } from '@/data'
import { AppError, ErrorCode } from '@/errors'
import { TokenType, TokenValidator } from '@/security/token'

interface CheckInviteResult {
  teamName: string
}

const checkInvite = async (token: string): Promise<CheckInviteResult> => {
  const tokenRecord = await tokenRepo.findByToken(token)

  const validatedToken = TokenValidator.validate(tokenRecord, TokenType.UserInvitation)

  const userCompanies = await companyRepo.findUserCompanies(validatedToken.userId)

  if (userCompanies.length === 0) {
    throw new AppError(ErrorCode.InternalError, 'User has no team membership')
  }

  const { company } = userCompanies[0]

  return { teamName: company.name }
}

export default checkInvite
