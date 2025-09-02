import type { MiddlewareHandler } from 'hono'

import { isDevEnv, isStagingOrProdEnv, isTestEnv } from '@/lib/env'

import { dev, fallback, prodAndStage, test } from './env'

const getCorsMiddleware = (): MiddlewareHandler => {
  if (isTestEnv()) {
    return test()
  }

  if (isDevEnv()) {
    return dev()
  }

  if (isStagingOrProdEnv()) {
    return prodAndStage()
  }

  return fallback()
}

const corsMiddleware = getCorsMiddleware()

export default corsMiddleware
