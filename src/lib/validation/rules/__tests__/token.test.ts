import { describe, expect, it } from 'bun:test'
import { z } from 'zod'

import { TOKEN_LENGTH } from '@/security/token'

import rules from '../token'

describe('Token Validation Rules', () => {
  describe('token validation', () => {
    it('should accept valid internal tokens', () => {
      const validToken = 'a'.repeat(TOKEN_LENGTH)
      const result = rules.token.safeParse(validToken)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(validToken)
      }
    })

    it('should reject tokens that are too short', () => {
      const shortTokens = [
        '',
        'a',
        'a'.repeat(TOKEN_LENGTH - 1),
        'abc123',
        'short-token',
      ]

      for (const token of shortTokens) {
        const result = rules.token.safeParse(token)
        expect(result.success).toBe(false)
      }
    })

    it('should reject tokens that are too long', () => {
      const longTokens = [
        'a'.repeat(TOKEN_LENGTH + 1),
        'a'.repeat(TOKEN_LENGTH + 10),
        'a'.repeat(100),
      ]

      for (const token of longTokens) {
        const result = rules.token.safeParse(token)
        expect(result.success).toBe(false)
      }
    })

    it('should accept tokens with exactly the required length', () => {
      const exactLengthTokens = [
        'a'.repeat(TOKEN_LENGTH),
        '1'.repeat(TOKEN_LENGTH),
        'A'.repeat(TOKEN_LENGTH),
        (`abcd1234${'x'.repeat(TOKEN_LENGTH - 8)}`),
      ]

      for (const token of exactLengthTokens) {
        const result = rules.token.safeParse(token)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe(token)
        }
      }
    })

    it('should handle non-string input', () => {
      const nonStringInputs = [
        null,
        undefined,
        123,
        true,
        [],
        {},
      ]

      for (const input of nonStringInputs) {
        const result = rules.token.safeParse(input)
        expect(result.success).toBe(false)
      }
    })
  })

  describe('captchaToken validation', () => {
    it('should accept valid reCAPTCHA tokens', () => {
      const validTokens = [
        // Google's test token
        '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe',
        // Realistic reCAPTCHA token examples
        'ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZ567890abcdefghijklmnopqrstuvwxyz',
        'a'.repeat(500),
        'A'.repeat(1000),
        '1234567890ABCDEFGHIJ', // 20 chars - minimum
        'token_with_underscores_12', // 25 chars - valid
        'token-with-hyphens-123456', // 25 chars - valid
        'mixedCASE123_token-test', // 23 chars - valid
        `very_long_token_${'x'.repeat(1980)}`,
      ]

      for (const token of validTokens) {
        const result = rules.captchaToken.safeParse(token)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe(token)
        }
      }
    })

    it('should reject empty or missing tokens', () => {
      const emptyTokens = [
        '',
        null,
        undefined,
      ]

      for (const token of emptyTokens) {
        const result = rules.captchaToken.safeParse(token)
        expect(result.success).toBe(false)
      }
    })

    it('should reject tokens that are too short', () => {
      const shortTokens = [
        'a',
        'abc',
        'short',
        'a'.repeat(19), // Just under minimum
        '123456789012345', // 15 chars
      ]

      for (const token of shortTokens) {
        const result = rules.captchaToken.safeParse(token)
        expect(result.success).toBe(false)
      }
    })

    it('should reject tokens that are too long', () => {
      const longTokens = [
        'a'.repeat(2001), // Just over maximum
        'a'.repeat(3000),
        'a'.repeat(10000),
      ]

      for (const token of longTokens) {
        const result = rules.captchaToken.safeParse(token)
        expect(result.success).toBe(false)
      }
    })

    it('should accept tokens with exactly minimum and maximum lengths', () => {
      const boundaryTokens = [
        'a'.repeat(20), // Minimum length
        'a'.repeat(2000), // Maximum length
      ]

      for (const token of boundaryTokens) {
        const result = rules.captchaToken.safeParse(token)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe(token)
        }
      }
    })

    it('should reject tokens with invalid characters', () => {
      const invalidTokens = [
        'token with spaces',
        'token@with@symbols',
        'token#with#hash',
        'token%with%percent',
        'token+with+plus',
        'token=with=equals',
        'token/with/slash',
        'token\\with\\backslash',
        'token(with)parentheses',
        'token[with]brackets',
        'token{with}braces',
        'token|with|pipes',
        'token&with&ampersand',
        'token*with*asterisk',
        'token!with!exclamation',
        'token?with?question',
        'token:with:colon',
        'token;with;semicolon',
        'token,with,comma',
        'token.with.dots',
        'token<with>angles',
        'token"with"quotes',
        'token\'with\'apostrophes',
        'token`with`backticks',
        'token~with~tildes',
        'token^with^carets',
        'token$with$dollars',
        'tökën_wíth_ùnícödé',
        '令牌与中文字符',
        'токен_с_кириллицей',
        'टोकन_हिंदी_में',
      ]

      for (const token of invalidTokens) {
        const result = rules.captchaToken.safeParse(token)
        expect(result.success).toBe(false)
      }
    })

    it('should accept tokens with valid characters only', () => {
      const validCharacterTokens = [
        'abcdefghijklmnopqrstuvwxyz', // 26 chars - valid
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ', // 26 chars - valid
        '01234567890123456789', // 20 chars - minimum length
        'token_with_underscores_123', // 26 chars - valid
        'token-with-hyphens-456', // 23 chars - valid
        'MIXED_case_TOKEN-with_NUMBERS_789', // 33 chars - valid
        'a1b2c3d4e5f6g7h8i9j0k1l2', // 24 chars - valid
        '___underscore_only___123', // 24 chars - valid
        '---hyphen-only---1234567', // 24 chars - valid
        '123456789012345678901234567890', // 30 chars - valid
        'aZ_-123456789012345678', // 22 chars - valid
      ]

      for (const token of validCharacterTokens) {
        const result = rules.captchaToken.safeParse(token)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe(token)
        }
      }
    })

    it('should handle non-string input', () => {
      const nonStringInputs = [
        123,
        true,
        false,
        [],
        {},
        new Date(),
      ]

      for (const input of nonStringInputs) {
        const result = rules.captchaToken.safeParse(input)
        expect(result.success).toBe(false)
      }
    })

    it('should validate realistic reCAPTCHA token scenarios', () => {
      // Simulating real-world reCAPTCHA token patterns
      const realisticTokens = [
        // Google's test key (known valid format)
        '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe',
        // Typical long reCAPTCHA response tokens
        '03AGdBq26QjK8_XvX8_xXx1XxXxXxXxXxXxXxXxXx',
        '03ADUVwxyx_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567890',
        // Base64url-like patterns common in JWT/tokens
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        'abcd1234-efgh5678_ijkl9012-mnop3456_qrst7890',
        'VGhpc19pc19hX3Rlc3RfdG9rZW5fZm9yX3JlQ0FQVENIQQ',
      ]

      for (const token of realisticTokens) {
        const result = rules.captchaToken.safeParse(token)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe(token)
        }
      }
    })
  })

  describe('default and opt properties', () => {
    it('should work as required by default for token', () => {
      const validToken = 'a'.repeat(TOKEN_LENGTH)
      expect(() => rules.token.parse(validToken)).not.toThrow()
      expect(() => rules.token.parse('')).toThrow()
      expect(() => rules.token.parse(null)).toThrow()
      expect(() => rules.token.parse(undefined)).toThrow()
    })

    it('should have .opt property for token that allows null and undefined', () => {
      const validToken = 'a'.repeat(TOKEN_LENGTH)
      expect(() => rules.token.opt.parse(validToken)).not.toThrow()
      expect(() => rules.token.opt.parse(null)).not.toThrow()
      expect(() => rules.token.opt.parse(undefined)).not.toThrow()
      expect(() => rules.token.opt.parse('')).toThrow() // Empty string still fails validation
      expect(() => rules.token.opt.parse('short')).toThrow() // Wrong length still fails
    })

    it('should work as required by default for captchaToken', () => {
      expect(() => rules.captchaToken.parse('valid_captcha_token_123')).not.toThrow()
      expect(() => rules.captchaToken.parse('')).toThrow()
      expect(() => rules.captchaToken.parse(null)).toThrow()
      expect(() => rules.captchaToken.parse(undefined)).toThrow()
    })

    it('should have .opt property for captchaToken that allows null and undefined', () => {
      expect(() => rules.captchaToken.opt.parse('valid_captcha_token_123')).not.toThrow()
      expect(() => rules.captchaToken.opt.parse(null)).not.toThrow()
      expect(() => rules.captchaToken.opt.parse(undefined)).not.toThrow()
      expect(() => rules.captchaToken.opt.parse('')).toThrow() // Empty string still fails
      expect(() => rules.captchaToken.opt.parse('short')).toThrow() // Too short still fails
      expect(() => rules.captchaToken.opt.parse('invalid@chars')).toThrow() // Invalid chars still fail
    })
  })

  describe('combined validation (schema-like usage)', () => {
    it('should validate auth object with both token types', () => {
      const authSchema = z.object({
        verificationToken: rules.token,
        captchaToken: rules.captchaToken,
      })

      const validAuth = {
        verificationToken: 'a'.repeat(TOKEN_LENGTH),
        captchaToken: '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe',
      }

      const result = authSchema.safeParse(validAuth)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.verificationToken).toBe(validAuth.verificationToken)
        expect(result.data.captchaToken).toBe(validAuth.captchaToken)
      }
    })

    it('should fail validation with invalid tokens', () => {
      const authSchema = z.object({
        verificationToken: rules.token,
        captchaToken: rules.captchaToken,
      })

      const invalidAuth = {
        verificationToken: 'too-short',
        captchaToken: 'invalid@captcha@token',
      }

      const result = authSchema.safeParse(invalidAuth)
      expect(result.success).toBe(false)
    })

    it('should work with optional captcha token in signup flow', () => {
      const signupSchema = z.object({
        email: z.string().email(),
        password: z.string(),
        captchaToken: rules.captchaToken.opt, // Optional for some flows
      })

      const validSignupWithCaptcha = {
        email: 'test@example.com',
        password: 'password123',
        captchaToken: 'valid_captcha_token_123',
      }

      const validSignupWithoutCaptcha = {
        email: 'test@example.com',
        password: 'password123',
        captchaToken: null,
      }

      expect(() => signupSchema.parse(validSignupWithCaptcha)).not.toThrow()
      expect(() => signupSchema.parse(validSignupWithoutCaptcha)).not.toThrow()
    })

    it('should validate multiple token formats in batch processing', () => {
      const tokens = [
        {
          internal: 'a'.repeat(TOKEN_LENGTH),
          captcha: '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe',
        },
        {
          internal: 'b'.repeat(TOKEN_LENGTH),
          captcha: 'valid_captcha_token_with_underscores_123',
        },
        {
          internal: '1'.repeat(TOKEN_LENGTH),
          captcha: 'VALID-CAPTCHA-TOKEN-WITH-HYPHENS-456',
        },
      ]

      const results = tokens.map(({ internal, captcha }) => ({
        internalResult: rules.token.safeParse(internal),
        captchaResult: rules.captchaToken.safeParse(captcha),
      }))

      results.forEach(({ internalResult, captchaResult }, index) => {
        expect(internalResult.success).toBe(true)
        expect(captchaResult.success).toBe(true)
        if (internalResult.success && captchaResult.success) {
          expect(internalResult.data).toBe(tokens[index].internal)
          expect(captchaResult.data).toBe(tokens[index].captcha)
        }
      })
    })
  })

  describe('edge cases and error messages', () => {
    it('should provide clear error messages for token validation', () => {
      const shortToken = 'short'
      const longToken = 'a'.repeat(TOKEN_LENGTH + 1)

      const shortResult = rules.token.safeParse(shortToken)
      const longResult = rules.token.safeParse(longToken)

      expect(shortResult.success).toBe(false)
      expect(longResult.success).toBe(false)

      if (!shortResult.success) {
        expect(shortResult.error.issues[0].message).toContain(`Token must be exactly ${TOKEN_LENGTH} characters long`)
      }
      if (!longResult.success) {
        expect(longResult.error.issues[0].message).toContain(`Token must be exactly ${TOKEN_LENGTH} characters long`)
      }
    })

    it('should provide clear error messages for captchaToken validation', () => {
      const emptyToken = ''
      const shortToken = 'short'
      const longToken = 'a'.repeat(2001)
      const invalidCharsToken = 'invalid@token@with@symbols@1234567890' // 35 chars with invalid @

      const emptyResult = rules.captchaToken.safeParse(emptyToken)
      const shortResult = rules.captchaToken.safeParse(shortToken)
      const longResult = rules.captchaToken.safeParse(longToken)
      const invalidCharsResult = rules.captchaToken.safeParse(invalidCharsToken)

      expect(emptyResult.success).toBe(false)
      expect(shortResult.success).toBe(false)
      expect(longResult.success).toBe(false)
      expect(invalidCharsResult.success).toBe(false)

      if (!emptyResult.success) {
        expect(emptyResult.error.issues[0].message).toContain('reCAPTCHA token is required')
      }
      if (!shortResult.success) {
        expect(shortResult.error.issues[0].message).toContain('reCAPTCHA token is too short')
      }
      if (!longResult.success) {
        expect(longResult.error.issues[0].message).toContain('reCAPTCHA token is too long')
      }
      if (!invalidCharsResult.success) {
        expect(invalidCharsResult.error.issues[0].message).toContain('reCAPTCHA token contains invalid characters')
      }
    })
  })
})
