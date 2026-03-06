import Action from './action'
import Resource from './resource'

export type PermissionMap = Partial<Record<Resource, Partial<Record<Action, boolean>>>>

enum Permission {
  ViewUsers = 'view:users',
  ViewAdmins = 'view:admins',
  ViewTeams = 'view:teams',
  ManageUsers = 'manage:users',
  ManageAdmins = 'manage:admins',
  ManageTeams = 'manage:teams',
}

export const getAdminDefaultPermissions = () => ({
  [Resource.Users]: { [Action.View]: true, [Action.Manage]: true },
  [Resource.Teams]: { [Action.View]: true, [Action.Manage]: true },
})

// Returns the same shape as getAdminDefaultPermissions but with all actions set to false.
// Used as a baseline before merging stored permissions so frontend always gets a full map
export const getAdminPermissionBaseline = (): Record<Resource, Record<Action, boolean>> => {
  const defaults = getAdminDefaultPermissions()

  return Object.fromEntries(
    Object.entries(defaults).map(([resource, actions]) => [
      resource,
      Object.fromEntries(Object.keys(actions).map(action => [action, false])),
    ]),
  ) as Record<Resource, Record<Action, boolean>>
}

export const getMemberDefaultPermissions = () => ({
  [Resource.Users]: { [Action.View]: true },
  [Resource.Teams]: { [Action.View]: true },
})

export default Permission
