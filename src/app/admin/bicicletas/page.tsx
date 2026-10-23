import Link from 'next/link'
import { getVehicles } from './actions'
import { Bike, Plus, Search, Edit, BatteryCharging, Zap } from 'lucide-react'
import BikeSlider from '@/components/admin/BikeSlider'
import DeleteVehicleButton from '@/components/admin/DeleteVehicleButton'
import StatusSelect from '@/components/admin/StatusSelect'

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function BicicletasPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  
  // Capturar bÃºsqueda por texto
  const rawQuery = resolvedParams?.q
  const query = typeof rawQuery === 'string' ? rawQuery : Array.isArray(rawQuery) ? rawQuery[0] ?? '' : ''

  // Capturar filtro por estado
  const rawStatus = resolvedParams?.status
  const statusFilter = typeof rawStatus === 'string' ? rawStatus : 'ALL'

  // Llamada a la acciÃ³n con ambos filtros
  const response = await getVehicles(query, statusFilter)
  const vehicles = response?.data ?? []

  const statusOptions = [
    { label: 'Todos', value: 'ALL' },
    { label: 'Disponibles', value: 'AVAILABLE' },
    { label: 'Reservados', value: 'RESERVED' },
    { label: 'Vendidos', value: 'SOLD' },
  ]

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <span className="crm-eyebrow">Catálogo</span>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0b0b0b] flex items-center gap-2">
            <Bike className="w-7 h-7 text-[#0b0b0b]" />
            Inventario de bicicletas eléctricas
          </h1>
          <p className="text-[#5d5d57] text-sm mt-1">
            Gestiona las bicicletas eléctricas disponibles y sus especificaciones.
          </p>
        </div>

        <Link href="/admin/bicicletas/nuevo" className="crm-btn crm-btn--primary">
          <Plus className="w-4 h-4" />
          <span>Agregar bicicleta</span>
        </Link>
      </div>

      {/* Buscador y Filtros por Estado */}
      <div className="crm-card p-4 space-y-3">
        <form method="GET" className="flex gap-2">
          {statusFilter !== 'ALL' && (
            <input type="hidden" name="status" value={statusFilter} />
          )}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a39b]" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Buscar por marca, modelo o año..."
              className="crm-input w-full pl-9"
            />
          </div>
          <button type="submit" className="crm-btn crm-btn--dark">
            Buscar
          </button>
        </form>

        {/* Pestañas de estado */}
        <div className="flex items-center gap-2 pt-3 border-t border-black/5 overflow-x-auto">
          <span className="text-[11px] font-bold text-[#a3a39b] uppercase tracking-[0.14em] shrink-0">
            Estado:
          </span>
          {statusOptions.map((opt) => {
            const isActive = statusFilter === opt.value
            const href = query
              ? `/admin/bicicletas?q=${encodeURIComponent(query)}${opt.value !== 'ALL' ? `&status=${opt.value}` : ''}`
              : `/admin/bicicletas${opt.value !== 'ALL' ? `?status=${opt.value}` : ''}`

            return (
              <Link
                key={opt.value}
                href={href}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 shrink-0 ${
                  isActive
                    ? 'bg-[#ffd51a] text-[#0b0b0b] shadow-[0_4px_12px_rgba(255,213,26,0.35)]'
                    : 'bg-black/5 text-[#5d5d57] hover:bg-black/10 hover:text-[#0b0b0b]'
                }`}
              >
                {opt.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Listado de bicicletas como tarjetas */}
      {vehicles.length === 0 ? (
        <div className="crm-card p-12 text-center text-[#5d5d57] space-y-3">
          <Bike className="w-12 h-12 mx-auto text-[#c9c7bd]" />
          <p className="font-bold text-base text-[#0b0b0b]">No hay bicicletas registradas</p>
          <p className="text-xs text-[#a3a39b]">
            {query || statusFilter !== 'ALL'
              ? 'No se encontraron resultados para los filtros seleccionados.'
              : 'Usa el botón "Agregar bicicleta" para registrar la primera.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="crm-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(11,11,11,0.08)]"
            >
              <div className="flex flex-col sm:flex-row gap-5">
                {/* Foto */}
                <div className="sm:w-60 shrink-0">
                  <div className="rounded-2xl overflow-hidden bg-[#f5f3ec] border border-black/5">
                    <BikeSlider images={v.media} />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col">
                  {/* Encabezado de la tarjeta */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 pb-3 border-b border-black/5">
                    <div>
                      <h3 className="font-extrabold tracking-tight text-[#0b0b0b] text-lg leading-tight">
                        {v.brand} {v.model}
                      </h3>
                      <p className="text-xs text-[#5d5d57] mt-0.5">
                        Color: <span className="text-[#0b0b0b] font-semibold">{v.color || 'N/A'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Selector directo de estado */}
                      <StatusSelect id={v.id} currentStatus={v.status} />

                      <div className="flex items-center gap-1 border-l border-black/10 pl-2">
                        <Link
                          href={`/admin/bicicletas/${v.id}/editar`}
                          title="Editar"
                          className="p-1.5 rounded-lg text-[#5d5d57] hover:bg-[#ffd51a]/25 hover:text-[#0b0b0b] transition-colors inline-flex"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        
                        <DeleteVehicleButton id={v.id} />
                      </div>
                    </div>
                  </div>

                  {/* Mini-grilla de datos */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 py-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#a3a39b]">
                        Año / autonomía
                      </p>
                      <p className="flex items-center gap-1.5 text-sm text-[#0b0b0b] mt-0.5">
                        <BatteryCharging className="w-4 h-4 text-[#a3a39b]" />
                        {v.rangeKm ?? v.mileage} km de autonomía
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#a3a39b]">
                        Asistencia / propulsión
                      </p>
                      <p className="flex items-center gap-1.5 text-sm text-[#0b0b0b] capitalize mt-0.5">
                        <Zap className="w-4 h-4 text-[#a3a39b]" />
                        {v.motorPower || v.transmission.toLowerCase().replaceAll('_', ' ')}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#a3a39b]">
                        Precio
                      </p>
                      <p className="text-sm font-extrabold text-[#0b0b0b] mt-0.5">
                        ${Number(v.price).toLocaleString('es-CO')} COP
                      </p>
                    </div>
                  </div>

                  {/* Descripción */}
                  {v.description && (
                    <div className="mt-auto pt-3">
                      <div className="bg-[#ffd51a]/12 border border-[#ffd51a]/40 rounded-xl p-3">
                        <p className="text-sm font-semibold text-[#0b0b0b] leading-relaxed break-words">
                          &ldquo;{v.description}&rdquo;
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
