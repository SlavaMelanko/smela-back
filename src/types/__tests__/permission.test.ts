import { describe, expect, it } from 'bun:test'

import { getAdminDefaultPermissions, getMemberDefaultPermissions } from '../permission'
import Resource from '../resource'

describe('getAdminDefaultPermissions', () => {
  it('should grant view and manage for users', () => {
    const permissions = getAdminDefaultPermissions()

    expect(permissions[Resource.Users]).toEqual({ view: true, manage: true })
  })

  it('should grant view and manage for teams', () => {
    const permissions = getAdminDefaultPermissions()

    expect(permissions[Resource.Teams]).toEqual({ view: true, manage: true })
  })

  it('should cover all expected resources', () => {
    const permissions = getAdminDefaultPermissions()

    expect(Object.keys(permissions)).toContain(Resource.Users)
    expect(Object.keys(permissions)).toContain(Resource.Teams)
  })
})

describe('getMemberDefaultPermissions', () => {
  it('should grant view but not manage for users', () => {
    const permissions = getMemberDefaultPermissions()

    expect(permissions[Resource.Users]).toEqual({ view: true })
  })

  it('should grant view but not manage for teams', () => {
    const permissions = getMemberDefaultPermissions()

    expect(permissions[Resource.Teams]).toEqual({ view: true })
  })

  it('should cover all expected resources', () => {
    const permissions = getMemberDefaultPermissions()

    expect(Object.keys(permissions)).toContain(Resource.Users)
    expect(Object.keys(permissions)).toContain(Resource.Teams)
  })
})
