import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Bike, BatteryCharging, Gauge, MapPin, Zap } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { whatsappLink } from '@/lib/site'

type PageProps = { params: Promise<{ slug: string }> }

export default async function BicicletaDetailPage({ params }: PageProps) {
  const { slug } = await params
  const bike = await prisma.vehicle.findFirst({
    where: { slug, published: true, status: 'AVAILABLE' },
    include: { media: { orderBy: { order: 'asc' } } },
  })

  if (!bike) notFound()

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <Link href="/bicicletas" className="text-sm font-semibold text-emerald-700 hover:underline">
        ← Volver al catálogo
      </Link>
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div className="relative min-h-[360px] overflow-hidden rounded-3xl bg-emerald-50">
          {bike.media[0] ? (
            <Image src={bike.media[0].url} alt={bike.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          ) : (
            <div className="grid h-full min-h-[360px] place-items-center text-emerald-600"><Bike className="h-28 w-28" /></div>
          )}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-600">Bikefast Electrics</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">{bike.title}</h1>
          <p className="mt-4 text-3xl font-bold text-slate-900">{money(bike.price)}</p>
          <p className="mt-6 leading-7 text-slate-600">{bike.description}</p>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <Spec icon={<BatteryCharging />} label="Autonomía" value={`${bike.rangeKm ?? bike.mileage} km`} />
            <Spec icon={<Zap />} label="Motor" value={bike.motorPower ?? 'Consultar'} />
            <Spec icon={<Gauge />} label="Asistencia" value={bike.transmission.replaceAll('_', ' ').toLowerCase()} />
            <Spec icon={<MapPin />} label="Ubicación" value={bike.city ?? 'Colombia'} />
          </div>
          <Link href={whatsappLink(`Hola Bikefast, me interesa ${bike.title}`)} className="mt-8 inline-flex rounded-full bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700">
            Consultar por WhatsApp
          </Link>
        </div>
      </div>
    </main>
  )
}

const money = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)

function Spec({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center gap-2 text-emerald-600">{icon}<span className="text-xs font-bold uppercase tracking-wide">{label}</span></div><p className="mt-2 text-sm font-semibold capitalize text-slate-800">{value}</p></div>
}
