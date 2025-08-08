import type { Context } from 'hono'

import { beforeEach, describe, expect, it, mock } from 'bun:test'

import type { AppContext } from '@/types/context'

import { userRepo } from '@/repositories'

import updateProfile from '../handler'

describe('updateProfile handler', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    role: 'user',
    status: 'active',
  }

  const mockUpdatedUser = {
    id: 1,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'test@example.com',
    role: 'user',
    status: 'active',
    tokenVersion: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  }

  beforeEach(() => {
    // Mock repository methods
    mock.module('@/repositories', () => ({
      userRepo: {
        update: mock(() => Promise.resolve(mockUpdatedUser)),
        findById: mock(() => Promise.resolve(mockUpdatedUser)),
      },
    }))
  })

  it('should update user profile successfully', async () => {
    const mockContext = {
      get: (key: string) => key === 'user' ? mockUser : undefined,
      req: {
        json: () => Promise.resolve({ firstName: 'Jane', lastName: 'Smith' }),
      },
      json: mock((data: any) => data),
    } as unknown as Context<AppContext>

    await updateProfile(mockContext)

    // Verify update was called with correct parameters
    expect(userRepo.update).toHaveBeenCalledWith(1, {
      firstName: 'Jane',
      lastName: 'Smith',
      updatedAt: expect.any(Date),
    })

    // Verify findById was NOT called since we get the user from update
    expect(userRepo.findById).not.toHaveBeenCalled()

    // Verify response
    expect(mockContext.json).toHaveBeenCalledWith({
      user: {
        id: 1,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'test@example.com',
        role: 'user',
        status: 'active',
        createdAt: mockUpdatedUser.createdAt,
        updatedAt: mockUpdatedUser.updatedAt,
      },
    })
  })

  it('should throw error if user not found after update', async () => {
    // Mock update to return null (e.g., user doesn't exist)
    mock.module('@/repositories', () => ({
      userRepo: {
        update: mock(() => Promise.resolve(null)),
        findById: mock(() => Promise.resolve(null)),
      },
    }))

    const mockContext = {
      get: (key: string) => key === 'user' ? mockUser : undefined,
      req: {
        json: () => Promise.resolve({ firstName: 'Jane', lastName: 'Smith' }),
      },
      json: mock((data: any) => data),
    } as unknown as Context<AppContext>

    try {
      await updateProfile(mockContext)
      expect(true).toBe(false) // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe('Failed to update user.')
    }
  })
})
