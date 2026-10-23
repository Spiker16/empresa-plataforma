import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { SITE_URL, SITE_NAME } from '@/lib/site'
import { serializeJsonLd } from '@/lib/json-ld'
import BikePreview from '@/components/BikePreview'
import { Gauge, Settings2, Fuel, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Bicicletas eléctricas en venta',
  description:
    'Encuentra bicicletas eléctricas para ciudad, trayectos largos y movilidad sostenible en Colombia.',
  alternates: {
    canonical: `${SITE_URL}/bicicletas`,
  },
  openGraph: {
    title: `Bicicletas eléctricas en venta | ${SITE_NAME}`,
    description:
      'Bicicletas eléctricas verificadas, asesoría comercial y atención Bikefast.',
    url: `${SITE_URL}/bicicletas`,
    type: 'website',
  },
}

export const revalidate = 60

async function getVehicles() {
  try {
    return await prisma.vehicle.findMany({
      where: { status: 'AVAILABLE', published: true },
      include: { media: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    })
  } catch (error) {
    console.error('Error cargando bicicletas eléctricas:', error)
    return []
  }
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(val)

export default async function VehiculosPage() {
  const vehicles = await getVehicles()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Bicicletas eléctricas en venta',
    itemListElement: vehicles.map((v, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Vehicle',
        name: v.title,
        url: `${SITE_URL}/bicicletas/${v.slug}`,
        brand: { '@type': 'Brand', name: v.brand },
        model: v.model,
        vehicleModelDate: String(v.year),
        mileageFromOdometer: v.mileage,
        fuelType: v.fuelType,
        image: v.media?.[0]?.url,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'COP',
          price: v.price,
          availability: 'https://schema.org/InStock',
        },
      },
    })),
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 dark:bg-neutral-950 dark:text-stone-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-stone-500">
          Catálogo
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight [font-family:var(--font-fraunces)] sm:text-5xl">
          Bicicletas eléctricas en venta
        </h1>
        <p className="mt-4 max-w-2xl text-base text-stone-600 dark:text-stone-400">
          Cada bicicleta eléctrica se publica con la información disponible del inventario y
          acompañamiento de nuestro equipo para elegir la mejor opción.
        </p>

        {vehicles.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-stone-200 bg-white p-12 text-center text-sm text-stone-500 dark:border-neutral-800 dark:bg-neutral-900">
            No hay bicicletas eléctricas publicados actualmente.
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => {
              const coverUrl = v.media?.[0]?.url || '/placeholder-bike.svg'
              const previewImages = (v.media || [])
                .filter((m) => m.type === 'IMAGE')
                .map((m) => ({ id: m.id, url: m.url }))
              return (
                <Link
                  key={v.id}
                  href={`/bicicletas/${v.slug}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white transition-all hover:border-stone-300 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.15)] dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
                >
                  <BikePreview
                    images={
                      previewImages.length > 0
                        ? previewImages
                        : [{ url: coverUrl }]
                    }
                    altPrefix={`${v.title}, modelo ${v.year}`}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="aspect-[4/3]"
                  />
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-1 text-xs text-stone-400 dark:text-stone-600">
                      <MapPin className="h-3 w-3" />
                      {v.city || 'General'}
                    </div>
                    <h2 className="mt-1 line-clamp-1 text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {v.title}
                    </h2>
                    <p className="mt-2 text-xl [font-family:var(--font-fraunces)] text-stone-900 dark:text-stone-50">
                      {formatCurrency(v.price)}
                    </p>
                    <div className="mt-auto flex items-center gap-3 pt-4 text-[11px] text-stone-500 dark:text-stone-500">
                      <span className="flex items-center gap-1">
                        <Gauge className="h-3.5 w-3.5" />
                        {v.mileage?.toLocaleString('es-CO')} km
                      </span>
                      <span className="flex items-center gap-1">
                        <Settings2 className="h-3.5 w-3.5" />
                        {v.transmission}
                      </span>
                      <span className="flex items-center gap-1">
                        <Fuel className="h-3.5 w-3.5" />
                        {v.fuelType}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
