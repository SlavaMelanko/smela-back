import type { MiddlewareHandler } from 'hono'

import { isDevEnv, isStagingOrProdEnv, isTestEnv } from '@/env'

import { dev, fallback, stagingAndProd, test } from './env'

const getCorsMiddleware = (): MiddlewareHandler => {
  if (isTestEnv()) {
    return test()
  }

  if (isDevEnv()) {
    return dev()
  }

  if (isStagingOrProdEnv()) {
    return stagingAndProd()
  }

  return fallback()
}

const corsMiddleware = getCorsMiddleware()

export default corsMiddleware
