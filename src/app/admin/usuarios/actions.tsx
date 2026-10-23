'use server'

import { prisma } from '@/lib/prisma'
import { RoleType, Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { hasAnyRole } from '@/lib/admin-auth'

const USER_ADMIN_ROLES = [RoleType.SUPER_ADMIN] as const

export async function getUsers(search?: string, roleFilter?: string) {
  try {
    if (!(await hasAnyRole(USER_ADMIN_ROLES))) {
      return { success: false, data: [] }
    }

    const searchTrimmed = search?.trim() ?? ''

    const whereClause: Prisma.UserWhereInput = {
      ...(roleFilter && roleFilter !== 'ALL'
        ? {
            roles: {
              some: {
                role: {
                  name: roleFilter as RoleType,
                },
              },
            },
          }
        : {}),
      ...(searchTrimmed
        ? {
            OR: [
              { name: { contains: searchTrimmed, mode: 'insensitive' } },
              { email: { contains: searchTrimmed, mode: 'insensitive' } },
              { phone: { contains: searchTrimmed, mode: 'insensitive' } },
            ],
          }
        : {}),
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, data: users }
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return { success: false, data: [] }
  }
}

export async function getUserById(id: string) {
  try {
    if (!(await hasAnyRole(USER_ADMIN_ROLES))) {
      return { success: false, data: null }
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            role: true,
          },
        },
      },
    })
    return { success: true, data: user }
  } catch (error) {
    console.error('Error al obtener el usuario:', error)
    return { success: false, data: null }
  }
}

export async function createUser(formData: FormData) {
  try {
    if (!(await hasAnyRole(USER_ADMIN_ROLES))) {
      return { success: false, error: 'No tienes autorización para administrar usuarios.' }
    }

    const name = formData.get('name')?.toString().trim()
    const email = formData.get('email')?.toString().trim().toLowerCase()
    const phone = formData.get('phone')?.toString().trim() || null
    const rawPassword = formData.get('password')?.toString().trim() || '123456'
    const requestedRole = formData.get('role')?.toString().trim()
    if (requestedRole && !Object.values(RoleType).includes(requestedRole as RoleType)) {
      return { success: false, error: 'El rol seleccionado no es válido.' }
    }
    const roleName = (requestedRole as RoleType) || RoleType.ASESOR_COMERCIAL

    if (!name || !email) {
      return { success: false, error: 'Nombre y correo electrónico son obligatorios.' }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return { success: false, error: 'Ya existe un usuario con este correo electrónico.' }
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(rawPassword, 10)

    await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        roles: {
          create: [
            {
              role: {
                connectOrCreate: {
                  where: { name: roleName },
                  create: { name: roleName },
                },
              },
            },
          ],
        },
      },
    })

    revalidatePath('/admin/usuarios')
    return { success: true }
  } catch (error) {
    console.error('Error al crear usuario:', error)
    return { success: false, error: 'No se pudo registrar el usuario.' }
  }
}

export async function updateUser(formData: FormData) {
  try {
    if (!(await hasAnyRole(USER_ADMIN_ROLES))) {
      return { success: false, error: 'No tienes autorización para administrar usuarios.' }
    }

    const id = formData.get('id')?.toString()
    if (!id) {
      return { success: false, error: 'ID de usuario no válido.' }
    }

    const name = formData.get('name')?.toString().trim()
    const email = formData.get('email')?.toString().trim().toLowerCase()
    const phone = formData.get('phone')?.toString().trim() || null
    const rawPassword = formData.get('password')?.toString().trim()
    const requestedRole = formData.get('role')?.toString().trim()
    if (requestedRole && !Object.values(RoleType).includes(requestedRole as RoleType)) {
      return { success: false, error: 'El rol seleccionado no es válido.' }
    }
    const roleName = (requestedRole as RoleType) || RoleType.ASESOR_COMERCIAL

    if (!name || !email) {
      return { success: false, error: 'Nombre y correo son obligatorios.' }
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id },
      },
    })

    if (existingUser) {
      return { success: false, error: 'El correo electrónico ya está en uso por otro usuario.' }
    }

    // Si se escribió una nueva contraseña, la encriptamos
    let hashedPassword: string | undefined = undefined
    if (rawPassword && rawPassword.length > 0) {
      hashedPassword = await bcrypt.hash(rawPassword, 10)
    }

    // Reasignar roles
    await prisma.userRole.deleteMany({
      where: { userId: id },
    })

    await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        ...(hashedPassword ? { password: hashedPassword } : {}),
        roles: {
          create: [
            {
              role: {
                connectOrCreate: {
                  where: { name: roleName },
                  create: { name: roleName },
                },
              },
            },
          ],
        },
      },
    })

    revalidatePath('/admin/usuarios')
    return { success: true }
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    return { success: false, error: 'No se pudo actualizar el usuario.' }
  }
}

export async function deleteUser(id: string) {
  try {
    if (!(await hasAnyRole(USER_ADMIN_ROLES))) {
      return { success: false, error: 'No tienes autorización para administrar usuarios.' }
    }

    await prisma.user.delete({ where: { id } })
    revalidatePath('/admin/usuarios')
    return { success: true }
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    return { success: false, error: 'No se pudo eliminar el usuario.' }
  }
}