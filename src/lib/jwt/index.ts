import { signJwt, verifyJwt } from './jwt'

const jwt = {
  sign: signJwt,
  verify: verifyJwt,
}

export default jwt
