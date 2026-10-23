'use server'

import { prisma } from '@/lib/prisma'
import { Prisma, Transmission, FuelType, VehicleType, ListingStatus, RoleType } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { syncVehicleEmbedding } from '@/lib/ai/embeddings'
import { hasAnyRole } from '@/lib/admin-auth'

const VEHICLE_ADMIN_ROLES = [
  RoleType.SUPER_ADMIN,
  RoleType.ADMIN_VEHICULOS,
  RoleType.ASESOR_COMERCIAL,
] as const

export async function getVehicles(search?: string, status?: string) {
  try {
    if (!(await hasAnyRole(VEHICLE_ADMIN_ROLES))) {
      return { success: false, data: [] }
    }

    const searchTrimmed = search?.trim() ?? ''
    const searchNumber = Number(searchTrimmed)
    const isValidNumber = searchTrimmed !== '' && !isNaN(searchNumber)

    // Construcción dinámica del filtro 'where' combinando búsqueda y estado
    const whereClause: Prisma.VehicleWhereInput = {
      ...(status && status !== 'ALL' && Object.values(ListingStatus).includes(status as ListingStatus)
        ? { status: status as ListingStatus }
        : {}),
      ...(searchTrimmed
        ? {
            OR: [
              { brand: { contains: searchTrimmed, mode: 'insensitive' } },
              { model: { contains: searchTrimmed, mode: 'insensitive' } },
              ...(isValidNumber ? [{ year: { equals: searchNumber } }] : []),
            ],
          }
        : {}),
    }

    const vehicles = await prisma.vehicle.findMany({
      where: whereClause,
      include: { media: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, data: vehicles }
  } catch (error) {
    console.error('Error al obtener vehículos:', error)
    return { success: false, data: [] }
  }
}

export async function getVehicleById(id: string) {
  try {
    if (!(await hasAnyRole(VEHICLE_ADMIN_ROLES))) {
      return { success: false, data: null }
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: { media: { orderBy: { order: 'asc' } } },
    })
    return { success: true, data: vehicle }
  } catch (error) {
    console.error('Error al obtener vehículo:', error)
    return { success: false, data: null }
  }
}

export async function createVehicle(formData: FormData) {
  try {
    if (!(await hasAnyRole(VEHICLE_ADMIN_ROLES))) {
      return { success: false, error: 'No tienes autorización para administrar vehículos.' }
    }

    const brand = formData.get('brand')?.toString().trim()
    const model = formData.get('model')?.toString().trim()
    const yearStr = formData.get('year')?.toString().trim()
    const priceStr = formData.get('price')?.toString().trim()
    const mileageStr = formData.get('mileage')?.toString().trim()
    const transmission = (formData.get('transmission')?.toString().trim() as Transmission) || Transmission.ASISTENCIA_PEDAL
    const fuelType = FuelType.ELECTRICO
    const vehicleType = (formData.get('vehicleType')?.toString().trim() as VehicleType) || VehicleType.BICICLETA_ELECTRICA
    const status = (formData.get('status')?.toString().trim() as ListingStatus) || ListingStatus.AVAILABLE
    const color = formData.get('color')?.toString().trim() || ''
    const description = formData.get('description')?.toString().trim() || ''
    const mediaUrlsRaw = formData.get('mediaUrls')?.toString() || '[]'
    const mediaUrls: string[] = JSON.parse(mediaUrlsRaw)

    if (!brand || !model || !yearStr || !priceStr || !mileageStr) {
      return { success: false, error: 'Por favor completa todos los campos obligatorios.' }
    }

    const year = Number(yearStr)
    const price = Number(priceStr)
    const mileage = Number(mileageStr)

    const title = `${brand} ${model} ${year}`
    const slug = `${brand}-${model}-${year}-${Date.now()}`.toLowerCase().replace(/\s+/g, '-')

    const vehicle = await prisma.vehicle.create({
      data: {
        title,
        slug,
        brand,
        model,
        year,
        price,
        mileage,
        transmission,
        fuelType,
        vehicleType,
        color,
        description,
        status,
        published: true,
        media: {
          create: mediaUrls.map((url, index) => ({
            url,
            publicId: `img-${Date.now()}-${index}`,
            type: 'IMAGE',
            order: index,
          })),
        },
      },
    })

    // 🤖 Sincronizar vector con IA para búsqueda semántica / Bot
    try {
      await syncVehicleEmbedding(vehicle.id)
    } catch (embeddingError) {
      console.error('Error al generar embedding del vehículo:', embeddingError)
    }

    // Revalidar páginas públicas y el panel administrativo
    revalidatePath('/')
    revalidatePath('/bicicletas')
    revalidatePath('/admin/bicicletas')

    return { success: true }
  } catch (error) {
    console.error('Error al crear vehículo:', error)
    return { success: false, error: 'No se pudo registrar el vehículo.' }
  }
}

export async function updateVehicle(id: string, formData: FormData) {
  try {
    if (!(await hasAnyRole(VEHICLE_ADMIN_ROLES))) {
      return { success: false, error: 'No tienes autorización para administrar vehículos.' }
    }

    const brand = formData.get('brand')?.toString().trim()
    const model = formData.get('model')?.toString().trim()
    const yearStr = formData.get('year')?.toString().trim()
    const priceStr = formData.get('price')?.toString().trim()
    const mileageStr = formData.get('mileage')?.toString().trim()
    const transmission = (formData.get('transmission')?.toString().trim() as Transmission) || Transmission.ASISTENCIA_PEDAL
    const fuelType = FuelType.ELECTRICO
    const vehicleType = (formData.get('vehicleType')?.toString().trim() as VehicleType) || VehicleType.BICICLETA_ELECTRICA
    const status = (formData.get('status')?.toString().trim() as ListingStatus) || ListingStatus.AVAILABLE
    const color = formData.get('color')?.toString().trim() || ''
    const description = formData.get('description')?.toString().trim() || ''
    const mediaUrlsRaw = formData.get('mediaUrls')?.toString() || '[]'
    const mediaUrls: string[] = JSON.parse(mediaUrlsRaw)

    if (!brand || !model || !yearStr || !priceStr || !mileageStr) {
      return { success: false, error: 'Por favor completa todos los campos obligatorios.' }
    }

    const year = Number(yearStr)
    const price = Number(priceStr)
    const mileage = Number(mileageStr)
    const title = `${brand} ${model} ${year}`

    // Eliminar fotos previas e insertar la lista actualizada
    await prisma.media.deleteMany({ where: { vehicleId: id } })

    await prisma.vehicle.update({
      where: { id },
      data: {
        title,
        brand,
        model,
        year,
        price,
        mileage,
        transmission,
        fuelType,
        vehicleType,
        color,
        description,
        status,
        media: {
          create: mediaUrls.map((url, index) => ({
            url,
            publicId: `img-${Date.now()}-${index}`,
            type: 'IMAGE',
            order: index,
          })),
        },
      },
    })

    // 🤖 Actualizar vector de la IA
    try {
      await syncVehicleEmbedding(id)
    } catch (embeddingError) {
      console.error('Error al actualizar embedding del vehículo:', embeddingError)
    }

    // Revalidar páginas públicas y el panel administrativo
    revalidatePath('/')
    revalidatePath('/bicicletas')
    revalidatePath('/admin/bicicletas')

    return { success: true }
  } catch (error) {
    console.error('Error al actualizar vehículo:', error)
    return { success: false, error: 'No se pudo actualizar el vehículo.' }
  }
}

export async function deleteVehicle(id: string) {
  try {
    if (!(await hasAnyRole(VEHICLE_ADMIN_ROLES))) {
      return { success: false, error: 'No tienes autorización para administrar vehículos.' }
    }

    await prisma.media.deleteMany({ where: { vehicleId: id } })

    await prisma.vehicle.delete({
      where: { id },
    })

    // Revalidar páginas públicas y el panel administrativo
    revalidatePath('/')
    revalidatePath('/bicicletas')
    revalidatePath('/admin/bicicletas')

    return { success: true }
  } catch (error) {
    console.error('Error al eliminar vehículo:', error)
    return { success: false, error: 'No se pudo eliminar el vehículo.' }
  }
}

export async function updateVehicleStatus(id: string, status: ListingStatus) {
  try {
    if (!(await hasAnyRole(VEHICLE_ADMIN_ROLES))) {
      return { success: false, error: 'No tienes autorización para administrar vehículos.' }
    }

    await prisma.vehicle.update({
      where: { id },
      data: { status },
    })

    // 🤖 Actualizar vector de la IA
    try {
      await syncVehicleEmbedding(id)
    } catch (embeddingError) {
      console.error('Error al re-indexar vehículo tras cambio de estado:', embeddingError)
    }

    // Revalidar páginas públicas y el panel administrativo
    revalidatePath('/')
    revalidatePath('/bicicletas')
    revalidatePath('/admin/bicicletas')

    return { success: true }
  } catch (error) {
    console.error('Error al actualizar el estado:', error)
    return { success: false, error: 'No se pudo cambiar el estado.' }
  }
}
