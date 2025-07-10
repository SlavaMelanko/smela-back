import { z } from 'zod'

import { SECURE_TOKEN_LENGTH } from '../../token-consts'

const rules = {
  token: z.string().length(
    SECURE_TOKEN_LENGTH,
    `Secure token must be exactly ${SECURE_TOKEN_LENGTH} characters long`,
  ),
}

export default rules
