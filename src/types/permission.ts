import Action from './action'
import Resource from './resource'

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

export const getMemberDefaultPermissions = () => ({
  [Resource.Users]: { [Action.View]: true, [Action.Manage]: false },
  [Resource.Teams]: { [Action.View]: true, [Action.Manage]: false },
})

export default Permission
