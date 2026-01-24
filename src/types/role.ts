enum Role {
  Owner = 'owner',
  Admin = 'admin',
  User = 'user',
}

export const isUser = (role: Role) => role === Role.User

export const isAdmin = (role: Role) => role === Role.Admin || role === Role.Owner

export const isOwner = (role: Role) => role === Role.Owner

export const isUserOrAdmin = (role: Role) => isUser(role) || isAdmin(role)

export default Role
