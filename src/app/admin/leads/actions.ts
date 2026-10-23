'use server'

import { prisma } from '@/lib/prisma'
import { LeadStatus, Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { ADMIN_ROLES, hasAnyRole } from '@/lib/admin-auth'

export async function getLeads(search?: string, statusFilter?: string) {
  try {
    if (!(await hasAnyRole(ADMIN_ROLES))) {
      return { success: false, data: [] }
    }

    const searchTrimmed = search?.trim() ?? ''

    const whereClause: Prisma.LeadWhereInput = {
      ...(statusFilter && statusFilter !== 'ALL'
        ? { status: statusFilter as LeadStatus }
        : {}),
      ...(searchTrimmed
        ? {
            OR: [
              { name: { contains: searchTrimmed, mode: 'insensitive' } },
              { email: { contains: searchTrimmed, mode: 'insensitive' } },
              { phone: { contains: searchTrimmed, mode: 'insensitive' } },
              { message: { contains: searchTrimmed, mode: 'insensitive' } },
            ],
          }
        : {}),
    }

    const leads = await prisma.lead.findMany({
      where: whereClause,
      include: {
        vehicle: {
          select: {
            id: true,
            title: true,
            brand: true,
            model: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, data: leads }
  } catch (error) {
    console.error('Error al obtener los leads:', error)
    return { success: false, data: [] }
  }
}

export async function getAdvisors() {
  try {
    if (!(await hasAnyRole(ADMIN_ROLES))) {
      return { success: false, data: [] }
    }

    const advisors = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: 'asc' },
    })
    return { success: true, data: advisors }
  } catch (error) {
    console.error('Error al obtener asesores:', error)
    return { success: false, data: [] }
  }
}

export async function createLead(formData: FormData) {
  try {
    if (!(await hasAnyRole(ADMIN_ROLES))) {
      return { success: false, error: 'No tienes autorización para administrar prospectos.' }
    }

    const name = formData.get('name')?.toString().trim()
    const email = formData.get('email')?.toString().trim().toLowerCase()
    const phone = formData.get('phone')?.toString().trim()
    const message = formData.get('message')?.toString().trim() || null
    const vehicleId = formData.get('vehicleId')?.toString() || null
    const assignedToId = formData.get('assignedToId')?.toString() || null
    const status = (formData.get('status')?.toString() as LeadStatus) || LeadStatus.NUEVO

    if (!name || !email || !phone) {
      return { success: false, error: 'Nombre, correo y teléfono son obligatorios.' }
    }

    await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        message,
        status,
        vehicleId,
        assignedToId,
      },
    })

    revalidatePath('/admin/leads')
    return { success: true }
  } catch (error) {
    console.error('Error al crear lead:', error)
    return { success: false, error: 'No se pudo crear el prospecto.' }
  }
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  try {
    if (!(await hasAnyRole(ADMIN_ROLES))) {
      return { success: false, error: 'No tienes autorización para administrar prospectos.' }
    }

    await prisma.lead.update({
      where: { id },
      data: {
        status,
        ...(status !== LeadStatus.NUEVO ? { needsHuman: false } : {}),
      },
    })

    revalidatePath('/admin/leads')
    return { success: true }
  } catch (error) {
    console.error('Error al actualizar estado del lead:', error)
    return { success: false, error: 'No se pudo actualizar el estado.' }
  }
}

export async function assignLead(id: string, assignedToId: string | null) {
  try {
    if (!(await hasAnyRole(ADMIN_ROLES))) {
      return { success: false, error: 'No tienes autorización para administrar prospectos.' }
    }

    await prisma.lead.update({
      where: { id },
      data: { assignedToId },
    })

    revalidatePath('/admin/leads')
    return { success: true }
  } catch (error) {
    console.error('Error al asignar el lead:', error)
    return { success: false, error: 'No se pudo asignar el usuario.' }
  }
}

export async function deleteLead(id: string) {
  try {
    if (!(await hasAnyRole(ADMIN_ROLES))) {
      return { success: false, error: 'No tienes autorización para administrar prospectos.' }
    }

    await prisma.lead.delete({ where: { id } })
    revalidatePath('/admin/leads')
    return { success: true }
  } catch (error) {
    console.error('Error al eliminar el lead:', error)
    return { success: false, error: 'No se pudo eliminar el prospecto.' }
  }
}