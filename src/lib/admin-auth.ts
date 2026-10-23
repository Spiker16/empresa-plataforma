import { RoleType } from '@prisma/client'
import { auth } from '@/lib/auth'

export const ADMIN_ROLES: RoleType[] = [
  RoleType.SUPER_ADMIN,
  RoleType.ADMIN_VEHICULOS,
  RoleType.ASESOR_COMERCIAL,
]

export async function hasAnyRole(allowedRoles: readonly RoleType[]): Promise<boolean> {
  const session = await auth()
  return session?.user?.roles?.some((role) => allowedRoles.includes(role)) ?? false
}
