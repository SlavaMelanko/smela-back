import type { Context } from 'hono'

import { describe, expect, test } from 'bun:test'

import { getDeviceInfo } from '../device'

describe('getDeviceInfo', () => {
  test('extracts IP from x-forwarded-for header', () => {
    const mockContext = {
      req: {
        header: (name: string) => {
          if (name === 'x-forwarded-for') {
            return '192.168.1.1, 10.0.0.1'
          }

          if (name === 'user-agent') {
            return 'Mozilla/5.0 Test Browser'
          }

          return undefined
        },
      },
    } as Context

    const result = getDeviceInfo(mockContext)

    expect(result).toEqual({
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 Test Browser',
    })
  })

  test('falls back to x-real-ip when x-forwarded-for is missing', () => {
    const mockContext = {
      req: {
        header: (name: string) => {
          if (name === 'x-real-ip') {
            return '203.0.113.1'
          }
          if (name === 'user-agent') {
            return 'Safari/537.36'
          }

          return undefined
        },
      },
    } as Context

    const result = getDeviceInfo(mockContext)

    expect(result).toEqual({
      ipAddress: '203.0.113.1',
      userAgent: 'Safari/537.36',
    })
  })
})
