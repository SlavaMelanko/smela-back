import { describe, expect, it } from 'bun:test'

import type { Metadata, UserPreferences } from '@/emails/types'

import type { PasswordResetEmailData } from '../email-renderer-password-reset'

import PasswordResetEmailRenderer from '../email-renderer-password-reset'

describe('Password Reset Email Renderer', () => {
  const renderer = new PasswordResetEmailRenderer()

  const mockData: PasswordResetEmailData = {
    firstName: 'John',
    resetUrl: 'https://example.com/reset-password?token=xyz789',
  }

  const mockMetadata: Metadata = {
    emailId: 'test-email-id',
    sentAt: '2024-01-01T00:00:00Z',
  }

  it('should render password reset email with required fields', async () => {
    const result = await renderer.render(mockData)

    expect(result).toHaveProperty('subject')
    expect(result).toHaveProperty('html')
    expect(result).toHaveProperty('text')
    expect(typeof result.subject).toBe('string')
    expect(typeof result.html).toBe('string')
    expect(typeof result.text).toBe('string')
    expect(result.subject.length).toBeGreaterThan(0)
    expect(result.html.length).toBeGreaterThan(0)
    expect(result.text.length).toBeGreaterThan(0)
  })

  it('should include user data in rendered output', async () => {
    const result = await renderer.render(mockData)

    expect(result.html).toContain(mockData.firstName)
    expect(result.html).toContain(mockData.resetUrl)
    expect(result.text).toContain(mockData.firstName)
    expect(result.text).toContain(mockData.resetUrl)
  })

  it('should render with English locale by default', async () => {
    const result = await renderer.render(mockData)

    // Basic check that subject is in English (contains common English words)
    expect(result.subject.toLowerCase()).toMatch(/password|reset|recovery|forgot/)
  })

  it('should render with Ukrainian locale when specified', async () => {
    const userPreferences: UserPreferences = {
      locale: 'uk',
      theme: 'light',
    }

    const result = await renderer.render(mockData, userPreferences)

    expect(result).toHaveProperty('subject')
    expect(result).toHaveProperty('html')
    expect(result).toHaveProperty('text')
    expect(result.subject.length).toBeGreaterThan(0)
  })

  it('should render with different themes', async () => {
    const lightPreferences: UserPreferences = {
      locale: 'en',
      theme: 'light',
    }

    const darkPreferences: UserPreferences = {
      locale: 'en',
      theme: 'dark',
    }

    const lightResult = await renderer.render(mockData, lightPreferences)
    const darkResult = await renderer.render(mockData, darkPreferences)

    // Both should render successfully
    expect(lightResult).toHaveProperty('html')
    expect(darkResult).toHaveProperty('html')
    expect(lightResult.subject).toBe(darkResult.subject) // Subject should be same
  })

  it('should include metadata when provided', async () => {
    const result = await renderer.render(mockData, undefined, mockMetadata)

    expect(result).toHaveProperty('subject')
    expect(result).toHaveProperty('html')
    expect(result).toHaveProperty('text')
    // Note: Metadata usage depends on template implementation
    // This test ensures metadata doesn't break rendering
  })

  it('should handle complete parameters', async () => {
    const userPreferences: UserPreferences = {
      locale: 'en',
      theme: 'light',
    }

    const result = await renderer.render(mockData, userPreferences, mockMetadata)

    expect(result).toHaveProperty('subject')
    expect(result).toHaveProperty('html')
    expect(result).toHaveProperty('text')
    expect(result.html).toContain(mockData.firstName)
    expect(result.html).toContain(mockData.resetUrl)
  })

  it('should handle special characters in firstName', async () => {
    const dataWithSpecialChars: PasswordResetEmailData = {
      firstName: 'José María',
      resetUrl: 'https://example.com/reset-password?token=xyz789',
    }

    const result = await renderer.render(dataWithSpecialChars)

    expect(result.html).toContain('José María')
    expect(result.text).toContain('José María')
  })

  it('should handle long reset URLs', async () => {
    const dataWithLongUrl: PasswordResetEmailData = {
      firstName: 'John',
      resetUrl: 'https://example.com/reset-password?token=very-long-reset-token-that-might-be-used-in-production-environments-with-secure-random-generation-xyz789abc123',
    }

    const result = await renderer.render(dataWithLongUrl)

    expect(result.html).toContain(dataWithLongUrl.resetUrl)
    expect(result.text).toContain(dataWithLongUrl.resetUrl)
  })

  it('should maintain consistency between password reset calls', async () => {
    const result1 = await renderer.render(mockData)
    const result2 = await renderer.render(mockData)

    // Same input should produce same output
    expect(result1.subject).toBe(result2.subject)
    expect(result1.html).toBe(result2.html)
    expect(result1.text).toBe(result2.text)
  })

  it('should handle different users with same reset URL pattern', async () => {
    const userData1: PasswordResetEmailData = {
      firstName: 'Alice',
      resetUrl: 'https://example.com/reset-password?token=token1',
    }

    const userData2: PasswordResetEmailData = {
      firstName: 'Bob',
      resetUrl: 'https://example.com/reset-password?token=token2',
    }

    const result1 = await renderer.render(userData1)
    const result2 = await renderer.render(userData2)

    // Different data should produce different output
    expect(result1.html).toContain('Alice')
    expect(result1.html).toContain('token1')
    expect(result2.html).toContain('Bob')
    expect(result2.html).toContain('token2')
    expect(result1.html).not.toContain('Bob')
    expect(result2.html).not.toContain('Alice')
  })
})
