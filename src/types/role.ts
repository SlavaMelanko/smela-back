enum Role {
  Owner = 'owner',
  Admin = 'admin',
  User = 'user',
  Enterprise = 'enterprise',
}

const isUser = (role: Role) => role === Role.User || role === Role.Enterprise
const isEnterprise = (role: Role) => role === Role.Enterprise
const isAdmin = (role: Role) => role === Role.Admin || role === Role.Owner
const isOwner = (role: Role) => role === Role.Owner

export { Role as default, isAdmin, isEnterprise, isOwner, isUser }
