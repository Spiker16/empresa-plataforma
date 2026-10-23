import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { SITE_URL } from '@/lib/site'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/bicicletas`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]

  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { published: true, status: 'AVAILABLE' },
      select: { slug: true, updatedAt: true },
    })

    const vehicleEntries: MetadataRoute.Sitemap = vehicles.map((v) => ({
      url: `${SITE_URL}/bicicletas/${v.slug}`,
      lastModified: v.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    return [...base, ...vehicleEntries]
  } catch (error) {
    console.error('Error generando sitemap:', error)
    return base
  }
}
