'use server'

import { prisma } from '@/lib/prisma'
import { ListingStatus, LeadStatus } from '@prisma/client'
import { ADMIN_ROLES, hasAnyRole } from '@/lib/admin-auth'

export async function getDashboardStats() {
  try {
    if (!(await hasAnyRole(ADMIN_ROLES))) {
      return { success: false, data: null }
    }

    const [
      totalBikes,
      availableBikes,
      totalLeads,
      newLeadsCount,
      inContactLeadsCount,
      closedLeadsCount,
      recentLeads,
      recentBikes,
    ] = await Promise.all([
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { status: ListingStatus.AVAILABLE } }),
      prisma.lead.count(),
      prisma.lead.count({ where: { status: LeadStatus.NUEVO } }),
      prisma.lead.count({ where: { status: LeadStatus.EN_CONTACTO } }),
      prisma.lead.count({ where: { status: LeadStatus.CERRADO } }),
      prisma.lead.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          vehicle: { select: { title: true } },
          assignedTo: { select: { name: true } },
        },
      }),
      prisma.vehicle.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: { media: { take: 1, orderBy: { order: 'asc' } } },
      }),
    ])

    return {
      success: true,
      data: {
        bikes: { total: totalBikes, available: availableBikes },
        leads: {
          total: totalLeads,
          nuevo: newLeadsCount,
          enContacto: inContactLeadsCount,
          cerrados: closedLeadsCount,
        },
        recentLeads,
        recentBikes,
      },
    }
  } catch (error) {
    console.error('Error al obtener estadísticas del Dashboard:', error)
    return { success: false, data: null }
  }
}
