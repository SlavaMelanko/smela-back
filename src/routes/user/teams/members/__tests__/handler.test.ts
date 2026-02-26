import { beforeEach, describe, expect, it, mock } from 'bun:test'

import { HttpStatus } from '@/net/http'
import { Resource } from '@/types'

import { getMemberDefaultPermissionsHandler } from '../handler'

describe('getMemberDefaultPermissionsHandler', () => {
  let mockJson: ReturnType<typeof mock>
  let mockContext: { json: typeof mockJson }

  beforeEach(() => {
    mockJson = mock((data: unknown, status: number) => ({ data, status }))
    mockContext = { json: mockJson }
  })

  it('should return default member permissions with OK status', () => {
    getMemberDefaultPermissionsHandler(mockContext as any, async () => {})

    expect(mockJson).toHaveBeenCalledWith(
      {
        permissions: {
          [Resource.Users]: { view: true },
          [Resource.Teams]: { view: true },
        },
      },
      HttpStatus.OK,
    )
  })
})
