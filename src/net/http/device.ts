import type { Context } from 'hono'

export interface DeviceInfo {
  ipAddress: string | null
  userAgent: string | null
}

export const getDeviceInfo = (c: Context): DeviceInfo => {
  const xForwardedFor = c.req.header('x-forwarded-for')
  const xRealIp = c.req.header('x-real-ip')

  const ipAddress = xForwardedFor?.split(',')[0].trim() || xRealIp?.trim() || null
  const userAgent = c.req.header('user-agent')?.trim() || null

  return { ipAddress, userAgent }
}
