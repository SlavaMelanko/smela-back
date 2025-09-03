import { AUTH_ROUTES_MAX_SIZE, DEFAULT_MAX_SIZE, FILE_UPLOAD_MAX_SIZE } from './constants'
import { createRequestSizeLimiter } from './factory'

export const generalRequestSizeLimiter = createRequestSizeLimiter({
  maxSize: DEFAULT_MAX_SIZE,
})

export const authRequestSizeLimiter = createRequestSizeLimiter({
  maxSize: AUTH_ROUTES_MAX_SIZE,
})

export const fileUploadSizeLimiter = createRequestSizeLimiter({
  maxSize: FILE_UPLOAD_MAX_SIZE,
})

export { createRequestSizeLimiter }
