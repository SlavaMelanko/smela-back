import { describe, expect, it } from 'bun:test'

import Resource from '@/types/resource'

import { rules } from '../rules'

describe('rules.permissions', () => {
  describe('valid boolean values', () => {
    it('should accept true for both flags', () => {
      const result = rules.permissions.parse({ [Resource.Users]: { view: true, manage: true } })

      expect(result[Resource.Users]).toEqual({ view: true, manage: true })
    })

    it('should accept false for both flags', () => {
      const result = rules.permissions.parse({ [Resource.Users]: { view: false, manage: false } })

      expect(result[Resource.Users]).toEqual({ view: false, manage: false })
    })

    it('should accept mixed true/false flags', () => {
      const result = rules.permissions.parse({ [Resource.Users]: { view: true, manage: false } })

      expect(result[Resource.Users]).toEqual({ view: true, manage: false })
    })
  })

  describe('null coercion', () => {
    it('should coerce null view to false', () => {
      const result = rules.permissions.parse({ [Resource.Users]: { view: null, manage: true } })

      expect(result[Resource.Users]).toEqual({ view: false, manage: true })
    })

    it('should coerce null manage to false', () => {
      const result = rules.permissions.parse({ [Resource.Users]: { view: true, manage: null } })

      expect(result[Resource.Users]).toEqual({ view: true, manage: false })
    })

    it('should coerce both null flags to false', () => {
      const result = rules.permissions.parse({ [Resource.Users]: { view: null, manage: null } })

      expect(result[Resource.Users]).toEqual({ view: false, manage: false })
    })
  })

  describe('undefined coercion', () => {
    it('should coerce undefined view to false', () => {
      const result = rules.permissions.parse({ [Resource.Users]: { manage: true } })

      expect(result[Resource.Users]).toEqual({ view: false, manage: true })
    })

    it('should coerce undefined manage to false', () => {
      const result = rules.permissions.parse({ [Resource.Users]: { view: true } })

      expect(result[Resource.Users]).toEqual({ view: true, manage: false })
    })

    it('should coerce both undefined flags to false', () => {
      const result = rules.permissions.parse({ [Resource.Users]: {} })

      expect(result[Resource.Users]).toEqual({ view: false, manage: false })
    })
  })

  describe('optional resource', () => {
    it('should allow a resource to be omitted when others are present', () => {
      const result = rules.permissions.parse({ [Resource.Users]: { view: true, manage: false } })

      expect(result[Resource.Teams]).toBeUndefined()
    })

    it('should allow partial resource coverage across multiple resources', () => {
      const result = rules.permissions.parse({
        [Resource.Users]: { view: true, manage: false },
        [Resource.Teams]: { view: null },
      })

      expect(result[Resource.Users]).toEqual({ view: true, manage: false })
      expect(result[Resource.Teams]).toEqual({ view: false, manage: false })
      expect(result[Resource.Admins]).toBeUndefined()
    })
  })

  describe('malformed inputs', () => {
    it('should reject empty object with no resources', () => {
      expect(() => rules.permissions.parse({})).toThrow()
    })

    it('should reject non-boolean view value', () => {
      expect(() =>
        rules.permissions.parse({ [Resource.Users]: { view: 'yes', manage: true } }),
      ).toThrow()
    })

    it('should reject non-boolean manage value', () => {
      expect(() =>
        rules.permissions.parse({ [Resource.Users]: { view: true, manage: 1 } }),
      ).toThrow()
    })

    it('should reject a non-object resource value', () => {
      expect(() =>
        rules.permissions.parse({ [Resource.Users]: 'read' }),
      ).toThrow()
    })
  })
})
