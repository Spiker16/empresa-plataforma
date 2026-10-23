'use client'

import { useState, useTransition, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Media, Vehicle } from '@prisma/client'
import { createVehicle, updateVehicle } from '@/app/admin/bicicletas/actions'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Bike, Loader2, Save, X, Image as ImageIcon, Upload } from 'lucide-react'

type VehicleFormData = Vehicle & { media: Media[] }
type VehicleFormProps = {
  initialData?: VehicleFormData
  isEditing?: boolean
}

export default function VehicleForm({ initialData, isEditing = false }: VehicleFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Precio y autonomía
  const [priceRaw, setPriceRaw] = useState<string>(
    initialData?.price ? String(initialData.price) : ''
  )
  const [priceFormatted, setPriceFormatted] = useState<string>(
    initialData?.price ? Number(initialData.price).toLocaleString('es-CO') : ''
  )

  const [mileageRaw, setMileageRaw] = useState<string>(
    initialData?.mileage ? String(initialData.mileage) : ''
  )
  const [mileageFormatted, setMileageFormatted] = useState<string>(
    initialData?.mileage ? Number(initialData.mileage).toLocaleString('es-CO') : ''
  )

  // Lista de URLs de imágenes
  const [mediaUrls, setMediaUrls] = useState<string[]>(
    initialData?.media ? initialData.media.map((media) => media.url) : []
  )

  const handleNumberInput = (
    value: string,
    setRaw: (v: string) => void,
    setFormatted: (v: string) => void
  ) => {
    const digitsOnly = value.replace(/\D/g, '')
    setRaw(digitsOnly)
    setFormatted(digitsOnly ? Number(digitsOnly).toLocaleString('es-CO') : '')
  }

  // SUBIDA DIRECTA A SUPABASE STORAGE
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setError(null)

    try {
      const uploadedUrls: string[] = []

      for (const file of Array.from(files)) {
        // Generar un nombre único para la imagen
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`
        const filePath = `fotos/${fileName}`

        // Subir al bucket "vehiculos"
        const { error: uploadError } = await supabase.storage
          .from('vehiculos')
          .upload(filePath, file, { cacheControl: '3600', upsert: false })

        if (uploadError) {
          throw uploadError
        }

        // Obtener la URL pública oficial de Supabase
        const { data: publicUrlData } = supabase.storage
          .from('vehiculos')
          .getPublicUrl(filePath)

        uploadedUrls.push(publicUrlData.publicUrl)
      }

      setMediaUrls((prev) => [...prev, ...uploadedUrls])
    } catch (err: unknown) {
      console.error('Error al subir a Supabase Storage:', err)
      setError(err instanceof Error ? err.message : 'Ocurrió un error al cargar las fotos en Supabase Storage.')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const handleRemoveImage = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('price', priceRaw)
    formData.set('mileage', mileageRaw)
    formData.set('mediaUrls', JSON.stringify(mediaUrls))
    const vehicleId = initialData?.id
    if (isEditing && !vehicleId) {
      setError('No se pudo identificar el bicicleta eléctrica que quieres actualizar.')
      return
    }

    startTransition(async () => {
      const result = vehicleId
        ? await updateVehicle(vehicleId, formData)
        : await createVehicle(formData)

      if (result.success) {
        router.push('/admin/bicicletas')
        router.refresh()
      } else {
        setError(result.error || 'Ocurrió un error inesperado')
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/bicicletas"
          className="p-2 text-[#5d5d57] hover:text-[#0b0b0b] hover:bg-black/5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <p className="crm-eyebrow">Catálogo</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0b0b0b] flex items-center gap-2">
            <Bike className="w-7 h-7 text-[#0b0b0b]" />
            {isEditing ? 'Editar bicicleta eléctrica' : 'Registrar nueva bicicleta eléctrica'}
          </h1>
          <p className="text-[#5d5d57] text-sm mt-0.5">
            {isEditing ? 'Modifica los datos de la bicicleta eléctrica.' : 'Ingresa la información para el catálogo.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="crm-card p-6 space-y-6">
        {/* Información Principal */}
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-[#0b0b0b] mb-4 border-b border-black/5 pb-2">
            Información Principal
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1">
                Marca <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="brand"
                defaultValue={initialData?.brand || ''}
                required
                placeholder="Ej: Bikefast"
                className="crm-input w-full"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1">
                Modelo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="model"
                defaultValue={initialData?.model || ''}
                required
                placeholder="Ej: Rayo"
                className="crm-input w-full"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1">
                Año <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="year"
                defaultValue={initialData?.year || new Date().getFullYear()}
                required
                className="crm-input w-full"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1">
                Precio (COP) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a39b] text-sm">$</span>
                <input
                  type="text"
                  value={priceFormatted}
                  onChange={(e) => handleNumberInput(e.target.value, setPriceRaw, setPriceFormatted)}
                  required
                  placeholder="0"
                  className="crm-input w-full pl-7 pr-3 font-semibold text-[#0b0b0b]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1">
                Autonomía estimada (KM) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={mileageFormatted}
                  onChange={(e) => handleNumberInput(e.target.value, setMileageRaw, setMileageFormatted)}
                  required
                  placeholder="0"
                  className="crm-input w-full pr-12 pl-3 text-[#0b0b0b]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a3a39b] text-xs font-medium">km</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1">Color</label>
              <input
                type="text"
                name="color"
                defaultValue={initialData?.color || ''}
                placeholder="Ej: Blanco Perla"
                className="crm-input w-full"
              />
            </div>
          </div>
        </div>

        {/* Fotos */}
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-[#0b0b0b] mb-4 border-b border-black/5 pb-2 flex items-center justify-between">
            <span>Fotos de la bicicleta eléctrica</span>
            <span className="text-xs font-normal text-[#a3a39b]">{mediaUrls.length} imágenes agregadas</span>
          </h2>

          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3">
              <label className="flex-1 cursor-pointer bg-[#f5f3ec] hover:bg-[#ffd51a]/15 border-2 border-dashed border-black/15 hover:border-[#ffd51a] rounded-xl p-3 transition-colors flex items-center justify-center gap-2 text-[#0b0b0b] text-sm font-semibold">
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 text-[#0b0b0b] animate-spin" />
                    <span>Cargando...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-[#0b0b0b]" />
                    <span>Subir fotos desde tu equipo</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={isUploading}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-black/10"></div>
              <div className="flex-grow border-t border-black/10"></div>
            </div>
          </div>

          {/* Vistas previas */}
          {mediaUrls.length === 0 ? (
            <div className="border-2 border-dashed border-black/10 rounded-xl p-6 text-center text-[#a3a39b] text-sm">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 text-[#c9c7bd]" />
              <p>No hay fotos cargadas aún.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {mediaUrls.map((url, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden border border-black/10 aspect-video bg-[#f5f3ec]">
                  <Image
                    src={url}
                    alt={`Foto ${idx + 1}`}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-90 hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 bg-[#ffd51a] text-[#0b0b0b] text-[10px] font-bold uppercase tracking-[0.08em] px-2 py-0.5 rounded">
                      Principal
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Especificaciones */}
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-[#0b0b0b] mb-4 border-b border-black/5 pb-2">
            Especificaciones y Estado
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1">Tipo</label>
              <select
                name="vehicleType"
                defaultValue={initialData?.vehicleType || 'BICICLETA_ELECTRICA'}
                className="crm-select w-full"
              >
                <option value="BICICLETA_ELECTRICA">Bicicleta eléctrica</option>
                <option value="BICICLETA_CARGA">Bicicleta de carga</option>
                <option value="BICICLETA_URBANA">Bicicleta urbana</option>
                <option value="BICICLETA_MONTANA">Bicicleta de montaña</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1">Asistencia</label>
              <select
                name="transmission"
                defaultValue={initialData?.transmission || 'ASISTENCIA_PEDAL'}
                className="crm-select w-full"
              >
                <option value="ASISTENCIA_PEDAL">Asistencia al pedal</option>
                <option value="ACELERADOR">Acelerador</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1">Propulsión</label>
              <select
                name="fuelType"
                defaultValue="ELECTRICO"
                className="crm-select w-full"
              >
                <option value="ELECTRICO">Eléctrico</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1">Estado Comercial</label>
              <select
                name="status"
                defaultValue={initialData?.status || 'AVAILABLE'}
                className="crm-select w-full"
              >
                <option value="AVAILABLE">Disponible</option>
                <option value="RESERVED">Reservado</option>
                <option value="SOLD">Vendido</option>
              </select>
            </div>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1">Descripción</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={initialData?.description || ''}
            placeholder="Describe el estado general de la bicicleta eléctrica..."
            className="crm-input w-full resize-none"
          ></textarea>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/5">
          <Link
            href="/admin/bicicletas"
            className="crm-btn crm-btn--ghost"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending || isUploading}
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
                <span>{isEditing ? 'Guardar Cambios' : 'Registrar Bicicleta eléctrica'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}