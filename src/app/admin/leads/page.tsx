'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { LeadStatus, Prisma } from '@prisma/client'
import {
  getLeads,
  getAdvisors,
  createLead,
  updateLeadStatus,
  assignLead,
  deleteLead,
} from './actions'
import {
  MessageSquare,
  Search,
  UserPlus,
  Bot,
  Mail,
  Phone,
  Bike,
  Trash2,
  Loader2,
  X,
  MessageCircle,
} from 'lucide-react'

type LeadItem = Prisma.LeadGetPayload<{
  include: {
    vehicle: { select: { id: true; title: true; brand: true; model: true } }
    assignedTo: { select: { id: true; name: true; email: true } }
  }
}>

interface AdvisorItem {
  id: string
  name: string
  email: string
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadItem[]>([])
  const [advisors, setAdvisors] = useState<AdvisorItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isPending, startTransition] = useTransition()

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [resLeads, resAdvisors] = await Promise.all([
      getLeads(search, statusFilter),
      getAdvisors(),
    ])

    if (resLeads.success && resLeads.data) {
      setLeads(resLeads.data)
    }
    if (resAdvisors.success && resAdvisors.data) {
      setAdvisors(resAdvisors.data)
    }
    setLoading(false)
  }, [search, statusFilter])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchData()
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [fetchData])

  const handleStatusChange = (id: string, newStatus: LeadStatus) => {
    startTransition(async () => {
      await updateLeadStatus(id, newStatus)
      await fetchData()
    })
  }

  const handleAssignChange = (id: string, advisorId: string) => {
    startTransition(async () => {
      await assignLead(id, advisorId === 'unassigned' ? null : advisorId)
      await fetchData()
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este prospecto?')) {
      startTransition(async () => {
        await deleteLead(id)
        await fetchData()
      })
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await createLead(formData)
      if (res.success) {
        setIsModalOpen(false)
        await fetchData()
      } else {
        setFormError(res.error || 'Error al guardar el prospecto.')
      }
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NUEVO':
        return 'bg-[#ffd51a] text-[#0b0b0b] border-[#ffd51a]'
      case 'EN_CONTACTO':
        return 'bg-[#0b0b0b] text-[#ffd51a] border-[#0b0b0b]'
      case 'NEGOCIACION':
        return 'bg-[#ffd51a]/25 text-[#8a6d00] border-[#ffd51a]/60'
      case 'CERRADO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      default:
        return 'bg-black/5 text-[#5d5d57] border-black/10'
    }
  }

  const getWhatsappUrl = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '')
    const message = encodeURIComponent(
      `¡Hola ${name}! Gracias por contactarnos. ¿En qué podemos asesorarte hoy?`
    )
    return `https://wa.me/${cleanPhone}?text=${message}`
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="crm-eyebrow">Comercial</span>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0b0b0b] flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-[#0b0b0b]" />
            Leads & WhatsApp
          </h1>
          <p className="text-[#5d5d57] text-sm mt-1">
            Gestiona los prospectos recibidos, asigna asesores e inicia chats por WhatsApp.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null)
            setIsModalOpen(true)
          }}
          className="crm-btn crm-btn--primary"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Lead</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="crm-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a39b]" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo, teléfono o mensaje..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="crm-input w-full pl-9"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="crm-select"
        >
          <option value="ALL">Todos los Estados</option>
          <option value="NUEVO">Nuevos</option>
          <option value="EN_CONTACTO">En Contacto</option>
          <option value="NEGOCIACION">En Negociación</option>
          <option value="CERRADO">Cerrados (Ventas)</option>
          <option value="DESCARTADO">Descartados</option>
        </select>
      </div>

      {/* Tabla de Leads */}
      <div className="crm-card overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#5d5d57]">
            <Loader2 className="w-8 h-8 animate-spin text-[#ffd51a] mb-2" />
            <p className="text-sm font-medium">Cargando prospectos...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12 text-[#5d5d57]">
            <MessageSquare className="w-12 h-12 text-[#c9c7bd] mx-auto mb-3" />
            <p className="text-base font-extrabold tracking-tight text-[#0b0b0b]">No se encontraron prospectos</p>
            <p className="text-xs text-[#a3a39b] mt-1">Prueba cambiando los términos de búsqueda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="crm-table w-full text-left text-sm text-[#5d5d57]">
              <thead>
                <tr>
                  <th className="px-6 py-3.5">Cliente</th>
                  <th className="px-6 py-3.5">Interés / Mensaje</th>
                  <th className="px-6 py-3.5">Asesor Asignado</th>
                  <th className="px-6 py-3.5">Estado</th>
                  <th className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {leads.map((lead) => (
                  <tr key={lead.id} className="transition-colors">
                    {/* Nombre y Contacto */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="font-bold text-[#0b0b0b] text-sm">{lead.name}</p>
                        <div className="flex items-center gap-1.5 text-[#5d5d57] text-xs">
                          <Mail className="w-3.5 h-3.5 text-[#a3a39b] shrink-0" />
                          <span>{lead.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#5d5d57] text-xs">
                          <Phone className="w-3.5 h-3.5 text-[#a3a39b] shrink-0" />
                          <span>{lead.phone}</span>
                        </div>
                        {lead.needsHuman && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-rose-700">
                            <Bot className="h-3 w-3" />
                            IA · requiere asesor
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Bicicleta / Mensaje */}
                    <td className="px-6 py-4 max-w-xs">
                      <div className="space-y-1">
                        {lead.vehicle && (
                          <div className="inline-flex items-center gap-1 text-xs font-semibold text-[#0b0b0b] bg-[#ffd51a]/25 px-2 py-0.5 rounded">
                            <Bike className="w-3 h-3" /> {lead.vehicle.title}
                          </div>
                        )}
                        {lead.message ? (
                          <p className="text-xs text-[#5d5d57] line-clamp-2 italic">
                            &ldquo;{lead.message}&rdquo;
                          </p>
                        ) : (
                          <p className="text-xs text-[#a3a39b] italic">Sin mensaje</p>
                        )}
                        {lead.aiSummary && (
                          <p className="text-xs text-[#8a6d00] line-clamp-3">
                            <span className="font-semibold">Resumen IA:</span> {lead.aiSummary}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Asesor Asignado */}
                    <td className="px-6 py-4">
                      <select
                        value={lead.assignedTo?.id || 'unassigned'}
                        onChange={(e) => handleAssignChange(lead.id, e.target.value)}
                        disabled={isPending}
                        className="text-xs bg-[#f5f3ec] border border-black/10 rounded-lg py-1.5 px-2 text-[#0b0b0b] font-medium focus:outline-none focus:ring-2 focus:ring-[#ffd51a]/60"
                      >
                        <option value="unassigned">Sin Asignar</option>
                        {advisors.map((adv) => (
                          <option key={adv.id} value={adv.id}>
                            {adv.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Estado del Lead */}
                    <td className="px-6 py-4">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                        disabled={isPending}
                        className={`text-xs font-bold rounded-full py-1 px-2.5 border ${getStatusBadge(
                          lead.status
                        )} cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#ffd51a]/60`}
                      >
                        <option value="NUEVO">NUEVO</option>
                        <option value="EN_CONTACTO">EN CONTACTO</option>
                        <option value="NEGOCIACION">NEGOCIACIÓN</option>
                        <option value="CERRADO">CERRADO</option>
                        <option value="DESCARTADO">DESCARTADO</option>
                      </select>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={getWhatsappUrl(lead.phone, lead.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl transition-all duration-300 hover:-translate-y-px flex items-center justify-center shadow-[0_4px_12px_rgba(16,185,129,0.35)]"
                          title="Iniciar Chat en WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4 fill-white text-emerald-500" />
                        </a>

                        <button
                          onClick={() => handleDelete(lead.id)}
                          disabled={isPending}
                          className="p-2 text-[#5d5d57] hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="Eliminar Lead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear Lead */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="crm-modal w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-black/5">
              <h3 className="font-extrabold tracking-tight text-[#0b0b0b] text-lg">Registrar Nuevo Lead</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#5d5d57] hover:text-[#0b0b0b] p-1 rounded-lg hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ej: Ana María Gómez"
                  className="crm-input w-full"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="cliente@correo.com"
                  className="crm-input w-full"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="text"
                  name="phone"
                  required
                  placeholder="+57 300 123 4567"
                  className="crm-input w-full"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1">
                  Asesor Asignado
                </label>
                <select
                  name="assignedToId"
                  className="crm-select w-full"
                >
                  <option value="">Sin Asignar</option>
                  {advisors.map((adv) => (
                    <option key={adv.id} value={adv.id}>
                      {adv.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1">
                  Mensaje o Requerimiento
                </label>
                <textarea
                  name="message"
                  rows={3}
                  placeholder="Escribe la consulta inicial del cliente..."
                  className="crm-input w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="crm-btn crm-btn--ghost"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="crm-btn crm-btn--primary disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Guardar Lead</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}