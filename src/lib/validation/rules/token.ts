import { z } from 'zod'

import { TOKEN_LENGTH } from '../../token-consts'

const rules = {
  token: z.string().length(
    TOKEN_LENGTH,
    `Token must be exactly ${TOKEN_LENGTH} characters long`,
  ),
}

export default rules
