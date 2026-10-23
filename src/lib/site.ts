/**
 * Configuración central del sitio.
 * Cambia SITE_URL aquí (o vía variable de entorno NEXT_PUBLIC_SITE_URL)
 * una sola vez al subir a producción. Todo el SEO la consume desde este punto.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bikefastcolombia.com'
).replace(/\/+$/, '')

export const SITE_NAME = 'Bikefast Electrics'

export const SITE_DESCRIPTION =
  'Bicicletas eléctricas para moverte por Colombia con libertad, energía y acompañamiento personalizado.'

export const SITE_TITLE_DEFAULT =
  'Bikefast Electrics — Bicicletas eléctricas para tu ritmo'

export const SITE_TITLE_TEMPLATE = `%s | ${SITE_NAME}`

/**
 * Número de WhatsApp de contacto (formato internacional, sin "+").
 * Cambia aquí una sola vez para actualizar todos los enlaces de contacto.
 */
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '573044464028'

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}
