import type { userPermissionsTable } from '../../schema'

export type UserPermissionRecord = typeof userPermissionsTable.$inferSelect
