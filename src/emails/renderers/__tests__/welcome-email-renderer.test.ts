import { describe, expect, it } from 'bun:test'

import type { Metadata, UserPreferences } from '@/emails/types'

import type { WelcomeEmailData } from '../email-renderer-welcome'

import WelcomeEmailRenderer from '../email-renderer-welcome'

describe('Welcome Email Renderer', () => {
  const renderer = new WelcomeEmailRenderer()

  const mockData: WelcomeEmailData = {
    firstName: 'John',
    verificationUrl: 'https://example.com/verify?token=abc123',
  }

  const mockMetadata: Metadata = {
    emailId: 'test-email-id',
    sentAt: '2024-01-01T00:00:00Z',
  }

  it('should render welcome email with required fields', async () => {
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
    expect(result.html).toContain(mockData.verificationUrl)
    expect(result.text).toContain(mockData.firstName)
    expect(result.text).toContain(mockData.verificationUrl)
  })

  it('should render with English locale by default', async () => {
    const result = await renderer.render(mockData)

    // Basic check that subject is in English (contains common English words)
    expect(result.subject.toLowerCase()).toMatch(/welcome|verify|email|account/)
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
    expect(result.html).toContain(mockData.verificationUrl)
  })

  it('should handle special characters in firstName', async () => {
    const dataWithSpecialChars: WelcomeEmailData = {
      firstName: 'José María',
      verificationUrl: 'https://example.com/verify?token=abc123',
    }

    const result = await renderer.render(dataWithSpecialChars)

    expect(result.html).toContain('José María')
    expect(result.text).toContain('José María')
  })

  it('should handle long verification URLs', async () => {
    const dataWithLongUrl: WelcomeEmailData = {
      firstName: 'John',
      verificationUrl: 'https://example.com/verify?token=very-long-token-that-might-be-used-in-production-environments-with-secure-random-generation-abc123def456',
    }

    const result = await renderer.render(dataWithLongUrl)

    expect(result.html).toContain(dataWithLongUrl.verificationUrl)
    expect(result.text).toContain(dataWithLongUrl.verificationUrl)
  })
})
