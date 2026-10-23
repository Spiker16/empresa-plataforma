'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bike, LayoutDashboard, Loader2, MessageSquare, Plus, TrendingUp } from 'lucide-react'
import { getDashboardStats } from './actions'

type DashboardData = Awaited<ReturnType<typeof getDashboardStats>>['data']

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void getDashboardStats().then((response) => {
      if (response.success) setData(response.data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#5d5d57]">
        <Loader2 className="mb-2 h-8 w-8 animate-spin text-[#ffd51a]" />
        <p className="text-sm font-semibold">Cargando métricas de Bikefast...</p>
      </div>
    )
  }

  const bikes = data?.bikes ?? { total: 0, available: 0 }
  const leads = data?.leads ?? { total: 0, nuevo: 0, cerrados: 0 }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="crm-eyebrow">Panel de control</span>
          <h1 className="mt-2 flex items-center gap-2 text-3xl font-extrabold tracking-tight text-[#0b0b0b]">
            <LayoutDashboard className="h-7 w-7 text-[#0b0b0b]" />
            Panel Bikefast Electrics
          </h1>
          <p className="mt-1 text-sm text-[#5d5d57]">
            Inventario de bicicletas eléctricas, leads y conversaciones comerciales.
          </p>
        </div>
        <Link href="/admin/bicicletas/nuevo" className="crm-btn crm-btn--primary">
          <Plus className="h-4 w-4" />
          Nueva bicicleta
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Bicicletas en catálogo" value={bikes.total} detail={`${bikes.available} disponibles`} icon={<Bike />} />
        <MetricCard label="Leads totales" value={leads.total} detail={`${leads.nuevo} nuevos`} icon={<MessageSquare />} />
        <MetricCard label="Leads cerrados" value={leads.cerrados} detail={leads.total ? `${Math.round((leads.cerrados / leads.total) * 100)}% conversaciones` : '0% conversaciones'} icon={<TrendingUp />} />
      </div>

      <section className="crm-card p-5">
        <h2 className="mb-4 text-sm font-extrabold tracking-tight text-[#0b0b0b]">Últimos leads registrados</h2>
        {data?.recentLeads.length ? (
          <div className="divide-y divide-black/5">
            {data.recentLeads.map((lead) => (
              <div key={lead.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-[#0b0b0b]">{lead.name}</p>
                  <p className="text-xs text-[#5d5d57]">{lead.vehicle?.title ?? 'Consulta general sobre bicicletas'}</p>
                </div>
                <span className="crm-chip crm-chip--mute">{lead.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-[#5d5d57]">Aún no hay leads registrados.</p>
        )}
      </section>
    </div>
  )
}

function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string
  value: number
  detail: string
  icon: React.ReactNode
}) {
  return (
    <div className="crm-card flex items-center justify-between p-5 transition-transform duration-300 hover:-translate-y-0.5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5d5d57]">{label}</p>
        <h3 className="mt-1 text-3xl font-extrabold tracking-tight text-[#0b0b0b]">{value}</h3>
        <p className="mt-1 text-xs font-semibold text-[#8a6d00]">{detail}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffd51a] text-[#0b0b0b] [&>svg]:h-6 [&>svg]:w-6">
        {icon}
      </div>
    </div>
  )
}

