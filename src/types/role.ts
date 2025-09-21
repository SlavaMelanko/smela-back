enum Role {
  Owner = 'owner',
  Admin = 'admin',
  User = 'user',
  Enterprise = 'enterprise',
}

export const isUser = (role: Role) => role === Role.User || role === Role.Enterprise

export const isEnterprise = (role: Role) => role === Role.Enterprise

export const isAdmin = (role: Role) => role === Role.Admin || role === Role.Owner

export const isOwner = (role: Role) => role === Role.Owner

export default Role
