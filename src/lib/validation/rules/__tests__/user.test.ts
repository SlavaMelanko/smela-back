import { describe, expect, it } from 'bun:test'
import { z } from 'zod'

import { userRules as rules } from '../user'

describe('User Validation Rules', () => {
  describe('email normalization', () => {
    it('should normalize valid emails by converting to lowercase', () => {
      const emailsWithoutSpaces = [
        { input: 'test@example.com', expected: 'test@example.com' }, // Already lowercase
        { input: 'TEST@EXAMPLE.COM', expected: 'test@example.com' }, // All uppercase
        { input: 'Test@Example.Com', expected: 'test@example.com' }, // Mixed case
        { input: 'USER.NAME@DOMAIN.CO.UK', expected: 'user.name@domain.co.uk' }, // Complex domain
        { input: 'ADMIN@TEST-DOMAIN.COM', expected: 'admin@test-domain.com' }, // Hyphenated domain
        { input: 'CamelCase@Example.ORG', expected: 'camelcase@example.org' }, // CamelCase local part
        { input: 'user+TAG@Example.NET', expected: 'user+tag@example.net' }, // Plus addressing
        { input: 'User.123@Sub.Domain.CO.UK', expected: 'user.123@sub.domain.co.uk' }, // Subdomain
      ]

      for (const { input, expected } of emailsWithoutSpaces) {
        const result = rules.email.safeParse(input)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe(expected)
        }
      }
    })

    it('should normalize emails by trimming whitespace', () => {
      const emailsWithWhitespace = [
        { input: ' test@example.com', expected: 'test@example.com' }, // Leading space
        { input: 'test@example.com ', expected: 'test@example.com' }, // Trailing space
        { input: ' test@example.com ', expected: 'test@example.com' }, // Both sides
        { input: '  test@example.com  ', expected: 'test@example.com' }, // Multiple spaces
        { input: '\ttest@example.com\t', expected: 'test@example.com' }, // Tabs
        { input: '\ntest@example.com\n', expected: 'test@example.com' }, // Newlines
        { input: ' \t test@example.com \n ', expected: 'test@example.com' }, // Mixed whitespace
      ]

      for (const { input, expected } of emailsWithWhitespace) {
        const result = rules.email.safeParse(input)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe(expected)
        }
      }
    })

    it('should normalize emails with both whitespace and case changes', () => {
      const emailsWithBoth = [
        { input: ' TEST@EXAMPLE.COM ', expected: 'test@example.com' },
        { input: '\t User.Name@Domain.Co.UK \t', expected: 'user.name@domain.co.uk' },
        { input: ' ADMIN@TEST-DOMAIN.COM ', expected: 'admin@test-domain.com' },
        { input: '  MixedCase@Example.ORG  ', expected: 'mixedcase@example.org' },
        { input: '\n SUPPORT+HELP@Company.NET \n', expected: 'support+help@company.net' },
        { input: ' \t User123@Sub.Domain.COM \t ', expected: 'user123@sub.domain.com' },
      ]

      for (const { input, expected } of emailsWithBoth) {
        const result = rules.email.safeParse(input)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe(expected)
        }
      }
    })

    it('should preserve email structure while normalizing case', () => {
      const structuralEmails = [
        { input: 'user+tag@example.com', expected: 'user+tag@example.com' }, // Plus addressing
        { input: 'USER+TAG@EXAMPLE.COM', expected: 'user+tag@example.com' }, // Plus addressing uppercase
        { input: 'user.name@example.com', expected: 'user.name@example.com' }, // Dot in local part
        { input: 'USER.NAME@EXAMPLE.COM', expected: 'user.name@example.com' }, // Dot with uppercase
        { input: 'user-name@example.com', expected: 'user-name@example.com' }, // Hyphen in local part
        { input: 'USER-NAME@EXAMPLE.COM', expected: 'user-name@example.com' }, // Hyphen uppercase
        { input: 'user123@sub.domain.com', expected: 'user123@sub.domain.com' }, // Numbers and subdomain
        { input: 'USER123@SUB.DOMAIN.COM', expected: 'user123@sub.domain.com' }, // Numbers uppercase
      ]

      for (const { input, expected } of structuralEmails) {
        const result = rules.email.safeParse(input)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe(expected)
        }
      }
    })

    it('should handle edge cases in email normalization', () => {
      const edgeCases = [
        { input: 'a@b.co', expected: 'a@b.co' }, // Minimal valid email
        { input: 'A@B.CO', expected: 'a@b.co' }, // Minimal with uppercase
        { input: 'test.email.with+symbol@example.com', expected: 'test.email.with+symbol@example.com' }, // Complex local part
        { input: 'TEST.EMAIL.WITH+SYMBOL@EXAMPLE.COM', expected: 'test.email.with+symbol@example.com' }, // Complex with uppercase
        { input: '123@numbers.org', expected: '123@numbers.org' }, // Numeric local part
        { input: '123@NUMBERS.ORG', expected: '123@numbers.org' }, // Numeric with uppercase domain
      ]

      for (const { input, expected } of edgeCases) {
        const result = rules.email.safeParse(input)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe(expected)
        }
      }
    })

    it('should still validate email format before normalization', () => {
      const invalidEmails = [
        'invalid', // Invalid format
        'INVALID', // Invalid format uppercase
        'test@', // Incomplete
        '@EXAMPLE.COM', // Missing local part
        'test..test@example.com', // Invalid consecutive dots
        'TEST@EXAMPLE', // Missing TLD
      ]

      for (const email of invalidEmails) {
        const result = rules.email.safeParse(email)
        expect(result.success).toBe(false)
      }
    })

    it('should normalize international domain names correctly', () => {
      const internationalEmails = [
        { input: 'test@xn--mnchen-3ya.de', expected: 'test@xn--mnchen-3ya.de' }, // Punycode for münchen.de
        { input: 'TEST@XN--MNCHEN-3YA.DE', expected: 'test@xn--mnchen-3ya.de' }, // Uppercase punycode
        { input: ' TEST@XN--MNCHEN-3YA.DE ', expected: 'test@xn--mnchen-3ya.de' }, // With whitespace
        { input: 'info@example.org', expected: 'info@example.org' }, // Standard ASCII
        { input: 'INFO@EXAMPLE.ORG', expected: 'info@example.org' }, // Standard ASCII uppercase
        { input: ' INFO@EXAMPLE.ORG ', expected: 'info@example.org' }, // With whitespace
        { input: 'user@sub.domain.co.uk', expected: 'user@sub.domain.co.uk' }, // Complex TLD
        { input: 'USER@SUB.DOMAIN.CO.UK', expected: 'user@sub.domain.co.uk' }, // Complex TLD uppercase
        { input: ' USER@SUB.DOMAIN.CO.UK ', expected: 'user@sub.domain.co.uk' }, // With whitespace
      ]

      for (const { input, expected } of internationalEmails) {
        const result = rules.email.safeParse(input)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe(expected)
        }
      }
    })

    it('should handle whitespace-only input correctly', () => {
      const whitespaceOnlyInputs = [
        '', // Empty string
        ' ', // Single space
        '  ', // Multiple spaces
        '\t', // Tab
        '\n', // Newline
        ' \t \n ', // Mixed whitespace
      ]

      for (const input of whitespaceOnlyInputs) {
        const result = rules.email.safeParse(input)
        expect(result.success).toBe(false)
      }
    })
  })

  describe('email validation', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'test+tag@example.org',
        'user123@test-domain.com',
        'a@b.co',
      ]

      for (const email of validEmails) {
        const result = rules.email.safeParse(email)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe(email.toLowerCase())
        }
      }
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        '',
        'invalid',
        'test@',
        '@example.com',
        'test..test@example.com',
        'test@example',
        'test @example.com',
        'test@exam ple.com',
      ]

      for (const email of invalidEmails) {
        const result = rules.email.safeParse(email)
        expect(result.success).toBe(false)
      }
    })
  })

  describe('password validation', () => {
    it('should accept valid passwords', () => {
      const validPasswords = [
        'ValidPass123!',
        'AnotherP@ss1',
        'MySecure#Pass9',
        'Test$Password8',
        'StrongP@ssw0rd',
      ]

      for (const password of validPasswords) {
        const result = rules.password.safeParse(password)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe(password)
        }
      }
    })

    it('should reject passwords that are too short', () => {
      const shortPasswords = [
        '',
        '1234567',
        'Short1!',
        'A1@',
      ]

      for (const password of shortPasswords) {
        const result = rules.password.safeParse(password)
        expect(result.success).toBe(false)
      }
    })

    it('should accept passwords with both uppercase and lowercase letters (regex is case insensitive)', () => {
      const passwordsWithLowercase = [
        'validpass123!',
        'another@pass1',
        'mysecure#pass9',
        'UPPERCASE123!',
        'MixedCase123!',
      ]

      for (const password of passwordsWithLowercase) {
        const result = rules.password.safeParse(password)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe(password)
        }
      }
    })

    it('should reject passwords without numbers', () => {
      const noNumberPasswords = [
        'ValidPass!',
        'AnotherP@ss',
        'MySecure#Pass',
      ]

      for (const password of noNumberPasswords) {
        const result = rules.password.safeParse(password)
        expect(result.success).toBe(false)
      }
    })

    it('should reject passwords without special characters', () => {
      const noSpecialCharPasswords = [
        'ValidPass123',
        'AnotherPass1',
        'MySecurePass9',
      ]

      for (const password of noSpecialCharPasswords) {
        const result = rules.password.safeParse(password)
        expect(result.success).toBe(false)
      }
    })

    it('should accept passwords with various special characters', () => {
      const specialCharacters = ['@', '$', '!', '%', '*', '#', '?', '&']

      for (const char of specialCharacters) {
        const password = `ValidPass123${char}`
        const result = rules.password.safeParse(password)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe(password)
        }
      }
    })
  })

  describe('name validation', () => {
    it('should accept valid names', () => {
      const validNames = [
        'John',
        'Jane',
        'Alice',
        'Bob',
        'Maria',
        'A'.repeat(50), // Maximum length
        'Two Words',
        'O\'Connor',
        'Jean-Pierre',
      ]

      for (const name of validNames) {
        const result = rules.name.safeParse(name)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe(name)
        }
      }
    })

    it('should reject names that are too short', () => {
      const shortNames = [
        '',
        'A',
      ]

      for (const name of shortNames) {
        const result = rules.name.safeParse(name)
        expect(result.success).toBe(false)
      }
    })

    it('should reject names that are too long', () => {
      const longNames = [
        'A'.repeat(51), // Over maximum length
        'A'.repeat(100),
      ]

      for (const name of longNames) {
        const result = rules.name.safeParse(name)
        expect(result.success).toBe(false)
      }
    })

    it('should accept names with exactly minimum and maximum lengths', () => {
      const boundaryNames = [
        'AB', // Minimum length (2)
        'A'.repeat(50), // Maximum length (50)
      ]

      for (const name of boundaryNames) {
        const result = rules.name.safeParse(name)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe(name)
        }
      }
    })
  })

  describe('required vs nullish properties', () => {
    it('should work as required by default for email', () => {
      expect(() => rules.email.parse('test@example.com')).not.toThrow()
      expect(() => rules.email.parse('')).toThrow()
      expect(() => rules.email.parse(null)).toThrow()
      expect(() => rules.email.parse(undefined)).toThrow()
    })

    it('should support .nullish() for email that allows null and undefined', () => {
      const nullishEmail = rules.email.nullish()
      expect(() => nullishEmail.parse('test@example.com')).not.toThrow()
      expect(() => nullishEmail.parse(null)).not.toThrow()
      expect(() => nullishEmail.parse(undefined)).not.toThrow()
      expect(() => nullishEmail.parse('')).toThrow() // empty string still fails validation
    })

    it('should work as required by default for password', () => {
      expect(() => rules.password.parse('Password1!')).not.toThrow()
      expect(() => rules.password.parse('')).toThrow()
      expect(() => rules.password.parse(null)).toThrow()
      expect(() => rules.password.parse(undefined)).toThrow()
    })

    it('should support .nullish() for password that allows null and undefined', () => {
      const nullishPassword = rules.password.nullish()
      expect(() => nullishPassword.parse('Password1!')).not.toThrow()
      expect(() => nullishPassword.parse(null)).not.toThrow()
      expect(() => nullishPassword.parse(undefined)).not.toThrow()
      expect(() => nullishPassword.parse('weak')).toThrow() // weak password still fails
    })

    it('should work as required by default for name', () => {
      expect(() => rules.name.parse('John')).not.toThrow()
      expect(() => rules.name.parse('')).toThrow()
      expect(() => rules.name.parse(null)).toThrow()
      expect(() => rules.name.parse(undefined)).toThrow()
    })

    it('should support .nullish() for name that allows null and undefined', () => {
      const nullishName = rules.name.nullish()
      expect(() => nullishName.parse('John')).not.toThrow()
      expect(() => nullishName.parse(null)).not.toThrow()
      expect(() => nullishName.parse(undefined)).not.toThrow()
      expect(() => nullishName.parse('J')).toThrow() // too short still fails
    })

    it('should work in schemas with required fields by default', () => {
      const schema = z.object({
        email: rules.email,
        password: rules.password,
        name: rules.name,
      })

      const valid = {
        email: 'test@example.com',
        password: 'Password1!',
        name: 'John Doe',
      }

      expect(() => schema.parse(valid)).not.toThrow()
      expect(() => schema.parse({ ...valid, email: null })).toThrow()
    })

    it('should work in schemas with nullish fields using .nullish()', () => {
      const schema = z.object({
        firstName: rules.name.nullish(),
        lastName: rules.name.nullish(),
      })

      expect(() => schema.parse({})).not.toThrow()
      expect(() => schema.parse({ firstName: null })).not.toThrow()
      expect(() => schema.parse({ firstName: 'John' })).not.toThrow()
      expect(() => schema.parse({ firstName: 'John', lastName: null })).not.toThrow()
    })

    it('should support .optional() for name that allows undefined but not null', () => {
      const optionalName = rules.name.optional()
      expect(() => optionalName.parse('John')).not.toThrow()
      expect(() => optionalName.parse(undefined)).not.toThrow()
      expect(() => optionalName.parse(null)).toThrow() // null not allowed with .optional()
      expect(() => optionalName.parse('J')).toThrow() // too short still fails
    })
  })

  describe('combined validation (schema-like usage)', () => {
    it('should validate user object with all fields including email normalization', () => {
      const userSchema = z.object({
        firstName: rules.name,
        lastName: rules.name,
        email: rules.email,
        password: rules.password,
      })

      const validUser = {
        firstName: 'John',
        lastName: 'Doe',
        email: ' TEST@EXAMPLE.COM ',
        password: 'ValidPass123!',
      }

      const result = userSchema.safeParse(validUser)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('test@example.com') // Normalized (trimmed and lowercase)
        expect(result.data.firstName).toBe('John')
        expect(result.data.lastName).toBe('Doe')
        expect(result.data.password).toBe('ValidPass123!')
      }
    })

    it('should fail validation with invalid fields', () => {
      const userSchema = z.object({
        firstName: rules.name,
        lastName: rules.name,
        email: rules.email,
        password: rules.password,
      })

      const invalidUser = {
        firstName: 'A', // Too short
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'weak', // Doesn't meet requirements
      }

      const result = userSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('should normalize multiple email formats in batch processing', () => {
      const emails = [
        ' ADMIN@COMPANY.COM ',
        'USER@DOMAIN.ORG',
        '\t SUPPORT@HELP.NET \t',
        'Info@Example.Co.UK',
        '  Mixed.Case+Tag@Sub.Domain.COM  ',
      ]

      const expectedNormalized = [
        'admin@company.com',
        'user@domain.org',
        'support@help.net',
        'info@example.co.uk',
        'mixed.case+tag@sub.domain.com',
      ]

      const results = emails.map(email => rules.email.safeParse(email))

      results.forEach((result, index) => {
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe(expectedNormalized[index])
        }
      })
    })
  })
})
