'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { RoleType } from '@prisma/client'
import { hasAnyRole } from '@/lib/admin-auth'

const SETTINGS_ADMIN_ROLES = [RoleType.SUPER_ADMIN] as const

// Claves por defecto si no existen en BD
const DEFAULT_SETTINGS: Record<string, string> = {
  company_name: 'Bikefast Electrics',
  company_email: 'contacto@bikefast.com',
  company_phone: '+57 300 000 0000',
  company_address: 'Bogotá, Colombia',
  company_currency: 'COP',
  whatsapp_number: '+57 300 000 0000',
  whatsapp_welcome_msg: '¡Hola! Gracias por contactarnos. ¿En qué bicicleta eléctrica estás interesado?',
  ai_enabled: 'true',
  ai_auto_reply: 'false',
}

export async function getSettings() {
  try {
    if (!(await hasAnyRole(SETTINGS_ADMIN_ROLES))) {
      return { success: false, data: DEFAULT_SETTINGS }
    }

    const settingsList = await prisma.systemSetting.findMany()

    // Convertir lista a objeto clave-valor
    const settingsMap: Record<string, string> = { ...DEFAULT_SETTINGS }
    settingsList.forEach((item) => {
      settingsMap[item.key] = item.value
    })

    return { success: true, data: settingsMap }
  } catch (error) {
    console.error('Error al obtener configuraciones:', error)
    return { success: false, data: DEFAULT_SETTINGS }
  }
}

export async function updateSettings(formData: FormData) {
  try {
    if (!(await hasAnyRole(SETTINGS_ADMIN_ROLES))) {
      return { success: false, error: 'No tienes autorización para cambiar la configuración.' }
    }

    const entries = Array.from(formData.entries())

    for (const [key, value] of entries) {
      if (key.startsWith('$ACTION')) continue // Omitir campos internos de Next.js

      const strValue = value.toString().trim()

      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: strValue },
        create: { key, value: strValue },
      })
    }

    revalidatePath('/admin/configuracion')
    return { success: true }
  } catch (error) {
    console.error('Error al guardar configuraciones:', error)
    return { success: false, error: 'No se pudieron guardar los cambios.' }
  }
}