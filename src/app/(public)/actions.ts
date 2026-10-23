'use server'

import { prisma } from '@/lib/prisma'
import { searchSemantic } from '@/lib/ai/embeddings'
import { ListingStatus, LeadStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function getFeaturedListings() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { status: ListingStatus.AVAILABLE, published: true },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { media: { take: 1, orderBy: { order: 'asc' } } },
    })
    return { success: true, data: { vehicles } }
  } catch (error) {
    console.error('Error al cargar catálogo de bicicletas:', error)
    return { success: false, data: { vehicles: [] } }
  }
}

export async function searchPublicListings(query: string) {
  try {
    if (!query.trim()) return getFeaturedListings()

    const matches = await searchSemantic(query, 8)
    const vehicleIds = matches.map((match) => match.vehicleId).filter(Boolean) as string[]
    const vehicles = await prisma.vehicle.findMany({
      where: {
        id: { in: vehicleIds },
        published: true,
        status: ListingStatus.AVAILABLE,
      },
      include: { media: { take: 1, orderBy: { order: 'asc' } } },
    })

    return { success: true, data: { vehicles } }
  } catch (error) {
    console.error('Error en búsqueda semántica pública:', error)
    return { success: false, data: { vehicles: [] } }
  }
}

export async function submitPublicLead(formData: FormData) {
  try {
    const name = formData.get('name')?.toString().trim()
    const email = formData.get('email')?.toString().trim().toLowerCase()
    const phone = formData.get('phone')?.toString().trim()
    const message = formData.get('message')?.toString().trim() || null
    const vehicleId = formData.get('vehicleId')?.toString() || null

    if (!name || !email || !phone) {
      return { success: false, error: 'Por favor completa todos los campos requeridos.' }
    }

    await prisma.lead.create({
      data: { name, email, phone, message, vehicleId, status: LeadStatus.NUEVO },
    })

    revalidatePath('/admin/leads')
    return { success: true }
  } catch (error) {
    console.error('Error al registrar lead público:', error)
    return { success: false, error: 'Ocurrió un problema al enviar tu solicitud.' }
  }
}

export async function submitAssistantLead(formData: FormData) {
  try {
    const name = formData.get('name')?.toString().trim()
    const email = formData.get('email')?.toString().trim().toLowerCase()
    const phone = formData.get('phone')?.toString().trim()
    const message = formData.get('message')?.toString().trim() || null
    const assistantTranscript =
      formData.get('assistantTranscript')?.toString().trim().slice(0, 2500) || null
    const vehicleId = formData.get('vehicleId')?.toString().trim() || null

    if (
      !name ||
      name.length > 100 ||
      !email ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !phone ||
      phone.length > 40 ||
      (message && message.length > 1000)
    ) {
      return { success: false, error: 'Revisa los datos de contacto e intenta de nuevo.' }
    }

    if (vehicleId) {
      const availableBike = await prisma.vehicle.findFirst({
        where: { id: vehicleId, status: ListingStatus.AVAILABLE, published: true },
        select: { id: true },
      })
      if (!availableBike) {
        return {
          success: false,
          error: 'Esa bicicleta ya no aparece disponible. Actualiza la página y vuelve a intentarlo.',
        }
      }
    }

    await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        message,
        aiSummary: assistantTranscript,
        vehicleId,
        status: LeadStatus.NUEVO,
        aiHandled: true,
        needsHuman: true,
      },
    })

    revalidatePath('/admin/leads')
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error al registrar lead desde el asistente:', error)
    return { success: false, error: 'No se pudo enviar tu solicitud. Intenta de nuevo.' }
  }
}
