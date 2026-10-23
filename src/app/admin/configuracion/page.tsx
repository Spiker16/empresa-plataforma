'use client'

import { useState, useEffect, useTransition } from 'react'
import { getSettings, updateSettings } from './actions'
import {
  Settings,
  Building,
  MessageSquare,
  Bot,
  Save,
  Loader2,
  CheckCircle2,
  Globe,
  Mail,
  Phone,
  MapPin,
  DollarSign,
} from 'lucide-react'

export default function ConfiguracionPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'empresa' | 'whatsapp' | 'ia'>('empresa')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const res = await getSettings()
      if (res.success && res.data) {
        setSettings(res.data)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSuccessMessage(null)
    setErrorMessage(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await updateSettings(formData)
      if (res.success) {
        setSuccessMessage('Configuración guardada correctamente.')
        setTimeout(() => setSuccessMessage(null), 4000)
      } else {
        setErrorMessage(res.error || 'Ocurrió un error al guardar.')
      }
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#5d5d57]">
        <Loader2 className="w-8 h-8 animate-spin text-[#ffd51a] mb-2" />
        <p className="text-sm font-medium">Cargando configuración...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Encabezado */}
      <div>
        <span className="crm-eyebrow">Ajustes</span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0b0b0b] flex items-center gap-2">
          <Settings className="w-7 h-7 text-[#0b0b0b]" />
          Configuración del Sistema
        </h1>
        <p className="mt-1 text-sm text-[#5d5d57]">
          Administra los datos de la empresa, integración de WhatsApp y parámetros de la IA.
        </p>
      </div>

      {/* Alertas */}
      {successMessage && (
        <div className="p-4 bg-[#ffd51a]/15 border border-[#ffd51a]/50 text-[#0b0b0b] rounded-xl text-sm font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-[#8a6d00] shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold">
          {errorMessage}
        </div>
      )}

      {/* Pestañas de Navegación */}
      <div className="flex border-b border-black/10 gap-2 bg-white px-3 pt-2 rounded-t-[18px]">
        <button
          onClick={() => setActiveTab('empresa')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'empresa'
              ? 'border-[#ffd51a] text-[#0b0b0b]'
              : 'border-transparent text-[#5d5d57] hover:text-[#0b0b0b]'
          }`}
        >
          <Building className="w-4 h-4" />
          Empresa y Plataforma
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'whatsapp'
              ? 'border-[#ffd51a] text-[#0b0b0b]'
              : 'border-transparent text-[#5d5d57] hover:text-[#0b0b0b]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          WhatsApp y Leads
        </button>

        <button
          onClick={() => setActiveTab('ia')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'ia'
              ? 'border-[#ffd51a] text-[#0b0b0b]'
              : 'border-transparent text-[#5d5d57] hover:text-[#0b0b0b]'
          }`}
        >
          <Bot className="w-4 h-4" />
          IA y Asistente Virtual
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white p-6 rounded-b-[18px] border border-t-0 border-black/10 shadow-[0_1px_2px_rgba(11,11,11,0.04)] space-y-6">
          {/* TAB 1: DATOS DE LA EMPRESA */}
          {activeTab === 'empresa' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h2 className="text-base font-extrabold tracking-tight text-[#0b0b0b] border-b border-black/5 pb-2">
                Información General
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#a3a39b]" />
                    Nombre Comercial
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    defaultValue={settings.company_name || ''}
                    placeholder="Ej: Bikefast Electrics"
                    className="crm-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#a3a39b]" />
                    Correo Electrónico Oficial
                  </label>
                  <input
                    type="email"
                    name="company_email"
                    defaultValue={settings.company_email || ''}
                    placeholder="contacto@empresa.com"
                    className="crm-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#a3a39b]" />
                    Teléfono Principal
                  </label>
                  <input
                    type="text"
                    name="company_phone"
                    defaultValue={settings.company_phone || ''}
                    placeholder="+57 601 123 4567"
                    className="crm-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#a3a39b]" />
                    Moneda Principal
                  </label>
                  <select
                    name="company_currency"
                    defaultValue={settings.company_currency || 'COP'}
                    className="crm-select w-full"
                  >
                    <option value="COP">COP ($ Pesos Colombianos)</option>
                    <option value="USD">USD ($ Dólares Estadounidenses)</option>
                    <option value="MXN">MXN ($ Pesos Mexicanos)</option>
                    <option value="EUR">EUR (€ Euros)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#a3a39b]" />
                    Dirección Física
                  </label>
                  <input
                    type="text"
                    name="company_address"
                    defaultValue={settings.company_address || ''}
                    placeholder="Calle 100 # 15-20, Bogotá, Colombia"
                    className="crm-input w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WHATSAPP */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h2 className="text-base font-extrabold tracking-tight text-[#0b0b0b] border-b border-black/5 pb-2">
                Integración con WhatsApp
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1">
                    Número de WhatsApp para Recepción de Leads
                  </label>
                  <input
                    type="text"
                    name="whatsapp_number"
                    defaultValue={settings.whatsapp_number || ''}
                    placeholder="+573001234567 (incluir código de país)"
                    className="crm-input w-full"
                  />
                  <p className="text-xs text-[#a3a39b] mt-1">
                    Este número recibirá las alertas directas de prospectos interesados.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1">
                    Mensaje Predeterminado de Bienvenida / Lead
                  </label>
                  <textarea
                    name="whatsapp_welcome_msg"
                    rows={4}
                    defaultValue={settings.whatsapp_welcome_msg || ''}
                    className="crm-input w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IA Y ASISTENTE */}
          {activeTab === 'ia' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h2 className="text-base font-extrabold tracking-tight text-[#0b0b0b] border-b border-black/5 pb-2">
                Asistente Virtual e Inteligencia Artificial
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 p-3 bg-[#f5f3ec] rounded-xl border border-black/10">
                  <div>
                    <p className="text-sm font-bold text-[#0b0b0b]">Búsqueda Semántica Vectorial (pgvector)</p>
                    <p className="text-xs text-[#5d5d57]">
                      Permite buscar bicicletas eléctricas en lenguaje natural usando embeddings de 768 dimensiones.
                    </p>
                  </div>
                  <select
                    name="ai_enabled"
                    defaultValue={settings.ai_enabled || 'true'}
                    className="crm-select text-xs font-semibold shrink-0"
                  >
                    <option value="true">Activado</option>
                    <option value="false">Desactivado</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-4 p-3 bg-[#f5f3ec] rounded-xl border border-black/10">
                  <div>
                    <p className="text-sm font-bold text-[#0b0b0b]">Respuestas Automáticas a Leads</p>
                    <p className="text-xs text-[#5d5d57]">
                      Responde preguntas frecuentes a prospectos cuando llegan fuera de horario.
                    </p>
                  </div>
                  <select
                    name="ai_auto_reply"
                    defaultValue={settings.ai_auto_reply || 'false'}
                    className="crm-select text-xs font-semibold shrink-0"
                  >
                    <option value="true">Activado</option>
                    <option value="false">Desactivado</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Botón de Guardar */}
          <div className="flex justify-end pt-4 border-t border-black/5">
            <button
              type="submit"
              disabled={isPending}
              className="crm-btn crm-btn--primary disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}