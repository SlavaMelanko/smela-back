enum Permission {
  ViewUsers = 'view:users',
  ViewAdmins = 'view:admins',
  ViewTeams = 'view:teams',
  ManageUsers = 'manage:users',
  ManageAdmins = 'manage:admins',
  ManageTeams = 'manage:teams',
}

export const ALL_PERMISSIONS = Object.values(Permission)

export default Permission
