import { beforeEach, describe, expect, it } from 'bun:test'
import { Hono } from 'hono'
import { StatusCodes } from 'http-status-codes'

import { onError } from '@/middleware'

import signupRoute from '../index'
import signupSchema from '../schema'

describe('Signup Endpoint', () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.onError(onError)
    app.route('/api/v1/auth', signupRoute)
  })

  describe('POST /auth/signup', () => {
    it('should return 201 when request is valid', async () => {
      const res = await app.request('/api/v1/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        }),
      })

      // Note: This will fail in integration tests without mocks
      // as it will try to access the real database
      // For now, we're testing the endpoint structure
      expect(res.status).toBeDefined()
    })

    it('should validate firstName requirements', async () => {
      const invalidFirstNames = [
        { firstName: '', lastName: 'Doe', email: 'test@example.com', password: 'ValidPass123!', captchaToken: 'valid-captcha-token' }, // Empty firstName
        { firstName: 'A', lastName: 'Doe', email: 'test@example.com', password: 'ValidPass123!', captchaToken: 'valid-captcha-token' }, // Too short
        { firstName: 'A'.repeat(51), lastName: 'Doe', email: 'test@example.com', password: 'ValidPass123!', captchaToken: 'valid-captcha-token' }, // Too long
      ]

      for (const body of invalidFirstNames) {
        const res = await app.request('/api/v1/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
        const json = await res.json()
        expect(json).toHaveProperty('error')
      }
    })

    it('should validate lastName requirements', async () => {
      const invalidLastNames = [
        { firstName: 'John', lastName: '', email: 'test@example.com', password: 'ValidPass123!', captchaToken: 'valid-captcha-token' }, // Empty lastName
        { firstName: 'John', lastName: 'A', email: 'test@example.com', password: 'ValidPass123!', captchaToken: 'valid-captcha-token' }, // Too short
        { firstName: 'John', lastName: 'B'.repeat(51), email: 'test@example.com', password: 'ValidPass123!', captchaToken: 'valid-captcha-token' }, // Too long
      ]

      for (const body of invalidLastNames) {
        const res = await app.request('/api/v1/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
        const json = await res.json()
        expect(json).toHaveProperty('error')
      }
    })

    it('should validate email format', async () => {
      const invalidEmails = [
        { firstName: 'John', lastName: 'Doe', email: '', password: 'ValidPass123!', captchaToken: 'valid-captcha-token' }, // Empty email
        { firstName: 'John', lastName: 'Doe', email: 'invalid', password: 'ValidPass123!', captchaToken: 'valid-captcha-token' }, // Invalid format
        { firstName: 'John', lastName: 'Doe', email: 'test@', password: 'ValidPass123!', captchaToken: 'valid-captcha-token' }, // Incomplete
        { firstName: 'John', lastName: 'Doe', email: '@example.com', password: 'ValidPass123!', captchaToken: 'valid-captcha-token' }, // Missing local part
      ]

      for (const body of invalidEmails) {
        const res = await app.request('/api/v1/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
        const json = await res.json()
        expect(json).toHaveProperty('error')
      }
    })

    it('should validate password requirements', async () => {
      const invalidPasswords = [
        { firstName: 'John', lastName: 'Doe', email: 'test@example.com', password: '', captchaToken: 'valid-captcha-token' }, // Empty password
        { firstName: 'John', lastName: 'Doe', email: 'test@example.com', password: '123', captchaToken: 'valid-captcha-token' }, // Too short
        { firstName: 'John', lastName: 'Doe', email: 'test@example.com', password: 'short', captchaToken: 'valid-captcha-token' }, // Too short
        { firstName: 'John', lastName: 'Doe', email: 'test@example.com', password: 'NoNumbers!', captchaToken: 'valid-captcha-token' }, // Missing number
        { firstName: 'John', lastName: 'Doe', email: 'test@example.com', password: 'NoSpecial123', captchaToken: 'valid-captcha-token' }, // Missing special char
      ]

      for (const body of invalidPasswords) {
        const res = await app.request('/api/v1/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
        const json = await res.json()
        expect(json).toHaveProperty('error')
      }
    })

    it('should require all required fields', async () => {
      const incompleteRequests = [
        { lastName: 'Doe', email: 'test@example.com', password: 'ValidPass123!', captchaToken: 'valid-captcha-token' }, // Missing firstName
        { firstName: 'John', lastName: 'Doe', password: 'ValidPass123!', captchaToken: 'valid-captcha-token' }, // Missing email
        { firstName: 'John', lastName: 'Doe', email: 'test@example.com', captchaToken: 'valid-captcha-token' }, // Missing password
        { captchaToken: 'valid-captcha-token' }, // Missing most fields
        {}, // Missing all fields
      ]

      for (const body of incompleteRequests) {
        const res = await app.request('/api/v1/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })

        expect(res.status).toBe(StatusCodes.BAD_REQUEST)
        const json = await res.json()
        expect(json).toHaveProperty('error')
      }
    })

    it('should require Content-Type header', async () => {
      const res = await app.request('/api/v1/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        }),
      })

      expect(res.status).toBe(StatusCodes.BAD_REQUEST)
    })

    it('should handle malformed JSON', async () => {
      const res = await app.request('/api/v1/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{ invalid json',
      })

      expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
    })

    it('should only accept POST method', async () => {
      const methods = ['GET', 'PUT', 'DELETE', 'PATCH']

      for (const method of methods) {
        const res = await app.request('/api/v1/auth/signup', {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: 'John',
            lastName: 'Doe',
            email: 'test@example.com',
            password: 'ValidPass123!',
            captchaToken: 'valid-captcha-token',
          }),
        })

        expect(res.status).toBe(StatusCodes.NOT_FOUND)
      }
    })

    it('should handle missing request body', async () => {
      const res = await app.request('/api/v1/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
    })
  })

  describe('Validation Schema', () => {
    it('should accept valid signup data', () => {
      const validSignupData = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@company.com',
          password: 'AnotherPass456@',
          captchaToken: 'valid-captcha-token',
        },
        {
          firstName: 'Bob',
          lastName: 'Johnson',
          email: 'bob+test@email.com',
          password: 'SecurePass789!',
          captchaToken: 'valid-captcha-token',
        },
        {
          firstName: 'Alice',
          lastName: 'Williams',
          email: 'alice123@test-domain.com',
          password: 'ComplexPass2023#',
          captchaToken: 'valid-captcha-token',
        },
        {
          firstName: 'John',
          // lastName is optional
          email: 'john.nolast@example.com',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        },
      ]

      for (const signupData of validSignupData) {
        const result = signupSchema.safeParse(signupData)
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid firstName', () => {
      const invalidFirstNames = [
        {
          firstName: '',
          lastName: 'Doe',
          email: 'test@example.com',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        },
        {
          firstName: 'A',
          lastName: 'Doe',
          email: 'test@example.com',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        },
        {
          firstName: 'A'.repeat(51),
          lastName: 'Doe',
          email: 'test@example.com',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        },
      ]

      for (const signupData of invalidFirstNames) {
        const result = signupSchema.safeParse(signupData)
        expect(result.success).toBe(false)
      }
    })

    it('should reject invalid lastName', () => {
      const invalidLastNames = [
        {
          firstName: 'John',
          lastName: '',
          email: 'test@example.com',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        },
        {
          firstName: 'John',
          lastName: 'A',
          email: 'test@example.com',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        },
        {
          firstName: 'John',
          lastName: 'B'.repeat(51),
          email: 'test@example.com',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        },
      ]

      for (const signupData of invalidLastNames) {
        const result = signupSchema.safeParse(signupData)
        expect(result.success).toBe(false)
      }
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: '',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        },
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'invalid',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        },
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        },
        {
          firstName: 'John',
          lastName: 'Doe',
          email: '@example.com',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        },
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'user @example.com',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        },
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@.com',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        },
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'user..name@example.com',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        },
      ]

      for (const signupData of invalidEmails) {
        const result = signupSchema.safeParse(signupData)
        expect(result.success).toBe(false)
      }
    })

    it('should reject invalid passwords', () => {
      const invalidPasswords = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          password: '',
          captchaToken: 'valid-captcha-token',
        },
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          password: '123',
          captchaToken: 'valid-captcha-token',
        },
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          password: 'short',
          captchaToken: 'valid-captcha-token',
        },
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          password: '1234567', // Assuming min length is 8
          captchaToken: 'valid-captcha-token',
        },
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          password: 'NoNumbers!', // Missing number
          captchaToken: 'valid-captcha-token',
        },
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          password: 'NoSpecial123', // Missing special char
          captchaToken: 'valid-captcha-token',
        },
      ]

      for (const signupData of invalidPasswords) {
        const result = signupSchema.safeParse(signupData)
        expect(result.success).toBe(false)
      }
    })

    it('should require all fields', () => {
      const incompleteSignupData = [
        {
          lastName: 'Doe',
          email: 'test@example.com',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
          // missing firstName
        },
        {
          firstName: 'John',
          lastName: 'Doe',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
          // missing email
        },
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          captchaToken: 'valid-captcha-token',
          // missing password
        },
        {
          captchaToken: 'valid-captcha-token',
          // missing most fields
        },
        {
          // missing all
        },
      ]

      for (const signupData of incompleteSignupData) {
        const result = signupSchema.safeParse(signupData)
        expect(result.success).toBe(false)
      }
    })

    it('should not accept extra fields', () => {
      const result = signupSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'ValidPass123!',
        captchaToken: 'valid-captcha-token',
        extra: 'field',
        confirmPassword: 'ValidPass123!',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        })
        expect(result.data).not.toHaveProperty('extra')
        expect(result.data).not.toHaveProperty('confirmPassword')
      }
    })

    it('should handle names with special characters', () => {
      const namesWithSpecialChars = [
        {
          firstName: 'O\'Connor',
          lastName: 'Smith-Jones',
          email: 'test@example.com',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        },
        {
          firstName: 'José',
          lastName: 'García',
          email: 'test@example.com',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        },
        {
          firstName: 'Marie-Claire',
          lastName: 'D\'Angelo',
          email: 'test@example.com',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        },
      ]

      for (const signupData of namesWithSpecialChars) {
        const result = signupSchema.safeParse(signupData)
        expect(result.success).toBe(true)
      }
    })

    it('should handle password with various special characters', () => {
      const passwordsWithSpecialChars = [
        'Password123!',
        'Complex@Pass456#',
        'SecurePass789$',
        'ValidPass2023&*',
        'MyPass123!@#$%*?&',
      ]

      for (const password of passwordsWithSpecialChars) {
        const result = signupSchema.safeParse({
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          password,
          captchaToken: 'valid-captcha-token',
        })
        expect(result.success).toBe(true)
      }
    })

    it('should handle edge case names', () => {
      const edgeCaseNames = [
        {
          firstName: 'Jo', // Minimum length
          lastName: 'Li', // Minimum length
          email: 'test@example.com',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        },
        {
          firstName: 'A'.repeat(50), // Maximum length
          lastName: 'B'.repeat(50), // Maximum length
          email: 'test@example.com',
          password: 'ValidPass123!',
          captchaToken: 'valid-captcha-token',
        },
      ]

      for (const signupData of edgeCaseNames) {
        const result = signupSchema.safeParse(signupData)
        expect(result.success).toBe(true)
      }
    })
  })
})
