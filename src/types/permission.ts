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
  [Resource.Users]: { view: true, manage: true },
  [Resource.Teams]: { view: true, manage: true },
})

export const getMemberDefaultPermissions = () => ({
  [Resource.Users]: { view: true, manage: false },
  [Resource.Teams]: { view: true, manage: false },
})

export default Permission
