import Action from './action'
import Resource from './resource'

/** Parsed API input shape for permission assignments. Actions are fixed to `view`/`manage`. */
export type PermissionsInput = Partial<Record<Resource, { view: boolean, manage: boolean }>>

/** Internal domain representation. Actions are typed by the `Action` enum, each optional. */
export type PermissionMap = Partial<Record<Resource, Partial<Record<Action, boolean>>>>
export type AdminPermissionMap = Omit<Record<Resource, Record<Action, boolean>>, Resource.Admins>

enum Permission {
  ViewUsers = 'view:users',
  ViewAdmins = 'view:admins',
  ViewTeams = 'view:teams',
  ManageUsers = 'manage:users',
  ManageAdmins = 'manage:admins',
  ManageTeams = 'manage:teams',
}

// All resources and actions an admin can have, all set to false.
// Used as a baseline before merging stored permissions so frontend always gets a full map
export const getAdminBasePermissions = (): AdminPermissionMap => ({
  [Resource.Users]: { [Action.View]: false, [Action.Manage]: false },
  [Resource.Teams]: { [Action.View]: false, [Action.Manage]: false },
})

export const getAdminDefaultPermissions = (): AdminPermissionMap => ({
  ...getAdminBasePermissions(),
  [Resource.Users]: { [Action.View]: true, [Action.Manage]: true },
  [Resource.Teams]: { [Action.View]: true, [Action.Manage]: true },
})

export const getMemberDefaultPermissions = () => ({
  [Resource.Users]: { [Action.View]: true },
  [Resource.Teams]: { [Action.View]: true },
})

export default Permission
