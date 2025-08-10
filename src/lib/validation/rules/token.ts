import { z } from 'zod'

import { TOKEN_LENGTH } from '../../token'
import { withVariants } from '../with-variants'

const rules = {
  token: withVariants(
    z.string().length(
      TOKEN_LENGTH,
      `Token must be exactly ${TOKEN_LENGTH} characters long`,
    ),
  ),
}

export default rules
