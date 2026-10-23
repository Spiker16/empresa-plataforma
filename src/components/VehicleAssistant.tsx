'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useRef, useState, useTransition } from 'react'
import { submitAssistantLead } from '@/app/(public)/actions'
import { whatsappLink } from '@/lib/site'
import {
  Bot,
  CarFront,
  ImagePlus,
  LoaderCircle,
  MessageCircle,
  Send,
  UserRound,
  X,
} from 'lucide-react'

type VehicleSuggestion = {
  id: string
  title: string
  slug: string
  year: number
  price: number
  mileage: number
  transmission: string
  fuelType: string
  city: string | null
  images: string[]
}

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  vehicles?: VehicleSuggestion[]
  showPhotos?: boolean
}

type SupportedImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp'

type VehicleAssistantProps = {
  variant?: 'floating' | 'embedded'
  assistantEnabled?: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function renderAssistantContent(content: string) {
  return content.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

function isVehicleSuggestion(value: unknown): value is VehicleSuggestion {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.slug === 'string' &&
    typeof value.year === 'number' &&
    typeof value.price === 'number' &&
    typeof value.mileage === 'number' &&
    typeof value.transmission === 'string' &&
    typeof value.fuelType === 'string' &&
    (typeof value.city === 'string' || value.city === null) &&
    Array.isArray(value.images) &&
    value.images.every((image) => typeof image === 'string')
  )
}

function isSupportedImageMimeType(value: string): value is SupportedImageMimeType {
  return value === 'image/jpeg' || value === 'image/png' || value === 'image/webp'
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('No se pudo leer la imagen.'))
        return
      }
      resolve(reader.result.split(',')[1] || '')
    }
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    reader.readAsDataURL(file)
  })
}

export default function VehicleAssistant({
  variant = 'floating',
  assistantEnabled = true,
}: VehicleAssistantProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: assistantEnabled
        ? '¡Hola! Soy Carlos, asesor comercial virtual de Bikefast Electrics. Te ayudo a encontrar un bicicleta eléctrica, resolver tus dudas o iniciar la revisión preliminar de uno que quieras vender. ¿Qué tienes en mente?'
        : '¡Hola! Puedes dejar tus datos para que un asesor te ayude a encontrar un bicicleta eléctrica o a iniciar la evaluación del tuyo.',
    },
  ])
  const [draft, setDraft] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [isContactPending, startContactTransition] = useTransition()
  const [contactError, setContactError] = useState<string | null>(null)
  const [contactSent, setContactSent] = useState(false)
  const [suggestedVehicles, setSuggestedVehicles] = useState<VehicleSuggestion[]>([])
  const [contactVehicleId, setContactVehicleId] = useState('')
  const [contactMessageDraft, setContactMessageDraft] = useState('')
  const imageInput = useRef<HTMLInputElement>(null)

  if (pathname?.startsWith('/admin') || pathname === '/login') {
    return null
  }

  const conversationTranscript = messages
    .filter((message) => message.role === 'user')
    .slice(-6)
    .map((message) => `Cliente: ${message.content}`)
    .join('\n')
    .slice(0, 2500)

  const sendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = draft.trim() || (image ? '¿Qué observas en esta fotografía?' : '')
    if (!text || isSending) return

    setError(null)
    setIsSending(true)
    const nextMessages = [...messages, { role: 'user' as const, content: text }]
    setMessages(nextMessages)
    setDraft('')
    setImage(null)
    if (imageInput.current) imageInput.current.value = ''

    try {
      let imagePayload: { mimeType: SupportedImageMimeType; data: string } | undefined
      if (image) {
        if (!isSupportedImageMimeType(image.type)) {
          throw new Error('Adjunta una imagen JPG, PNG o WebP.')
        }
        imagePayload = { mimeType: image.type, data: await readImage(image) }
      }
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages
            .slice(1)
            .map(({ role, content }) => ({ role, content })),
          ...(imagePayload ? { image: imagePayload } : {}),
        }),
      })
      const result: unknown = await response.json()
      if (!response.ok || !isRecord(result) || typeof result.reply !== 'string') {
        const message =
          isRecord(result) && typeof result.error === 'string'
            ? result.error
            : 'No fue posible recibir una respuesta. Intenta de nuevo.'
        throw new Error(message)
      }

      const vehicles = Array.isArray(result.vehicles)
        ? result.vehicles.filter(isVehicleSuggestion)
        : []
      const reply = result.reply
      const showPhotos = result.showPhotos === true
      const openContactForm = result.openContactForm === true
      const requestedVehicleId =
        typeof result.contactVehicleId === 'string'
          ? result.contactVehicleId
          : ''
      const requestedContactMessage =
        typeof result.contactMessage === 'string'
          ? result.contactMessage
          : ''
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: reply, vehicles, showPhotos },
      ])
      if (openContactForm) {
        setContactVehicleId(requestedVehicleId)
        setContactMessageDraft(requestedContactMessage)
        setContactError(null)
        setIsContactOpen(true)
      }
      setSuggestedVehicles((current) => {
        const merged = new Map(current.map((vehicle) => [vehicle.id, vehicle]))
        vehicles.forEach((vehicle) => merged.set(vehicle.id, vehicle))
        return [...merged.values()]
      })
    } catch (sendError) {
      setMessages((current) => current.slice(0, -1))
      setDraft(text)
      setImage(image)
      setError(
        sendError instanceof Error
          ? sendError.message
          : 'No fue posible recibir una respuesta. Intenta de nuevo.'
      )
    } finally {
      setIsSending(false)
    }
  }

  const handleMessageKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (
      event.key !== 'Enter' ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return
    }
    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0]
    setError(null)
    if (!selected) {
      setImage(null)
      return
    }
    if (!isSupportedImageMimeType(selected.type)) {
      setImage(null)
      event.target.value = ''
      setError('Adjunta una imagen JPG, PNG o WebP.')
      return
    }
    if (selected.size > 2 * 1024 * 1024) {
      setImage(null)
      event.target.value = ''
      setError('La imagen debe pesar máximo 2 MB.')
      return
    }
    setImage(selected)
  }

  const handleContactSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setContactError(null)
    const formData = new FormData(event.currentTarget)
    startContactTransition(async () => {
      const result = await submitAssistantLead(formData)
      if (!result.success) {
        setContactError(result.error || 'No se pudo enviar la solicitud.')
        return
      }
      setContactSent(true)
      setIsContactOpen(false)
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content:
            'Listo, ya dejé tu solicitud para que un asesor te contacte. No te puedo confirmar descuentos ni una oferta de compra por aquí; el equipo revisará tu caso contigo.',
        },
      ])
    })
  }

  return (
    <div
      className={
        variant === 'embedded'
          ? 'w-full'
          : 'fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3'
      }
    >
      {(variant === 'embedded' || isOpen) && (
        <section
          aria-label="Asistente de bicicletas eléctricas"
          className={`flex ${
            variant === 'embedded'
              ? 'h-[min(680px,75vh)] min-h-[520px] w-full'
              : 'h-[min(640px,calc(100dvh-7rem))] w-[min(390px,calc(100vw-2rem))]'
          } flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900`}
        >
          <header className="flex items-center justify-between bg-stone-950 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-semibold">Carlos · Asesor comercial virtual</h2>
                <p className="text-xs text-stone-300">
                  {assistantEnabled ? 'Asesoría con inventario actual' : 'Asesoría personalizada'}
                </p>
              </div>
            </div>
            {variant === 'floating' && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-stone-300 hover:bg-white/10 hover:text-white"
                aria-label="Cerrar asistente"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </header>

          {assistantEnabled && (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-[11px] leading-relaxed text-amber-900">
              Tus mensajes y fotos se procesan en la instancia Ollama configurada por el
              concesionario. El chat no se guarda; al enviar el formulario, el CRM conserva
              tus datos y un extracto de hasta seis mensajes.
            </div>
          )}

          <div className="flex-1 space-y-3 overflow-y-auto bg-stone-50 p-3 dark:bg-neutral-950">
            {messages.length === 1 && (
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={!assistantEnabled}
                  onClick={() => setDraft('Estoy buscando comprar un bicicleta eléctrica. ¿Me ayudas a encontrar opciones según mi presupuesto y el uso que le voy a dar?')}
                  className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-left text-xs font-medium text-emerald-900 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-emerald-300 dark:hover:bg-neutral-800"
                >
                  Busco comprar un bicicleta eléctrica
                </button>
                <button
                  type="button"
                  disabled={!assistantEnabled}
                  onClick={() => setDraft('Quiero vender mi bicicleta eléctrica o entregarlo como parte de pago. Ayúdame a iniciar una evaluación preliminar.')}
                  className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-left text-xs font-medium text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-stone-200 dark:hover:bg-neutral-800"
                >
                  Quiero vender o entregar el mío
                </button>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex items-start gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    message.role === 'user'
                      ? 'bg-stone-200 text-stone-700 dark:bg-neutral-800 dark:text-stone-200'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {message.role === 'user' ? (
                    <UserRound className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </span>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'rounded-tr-sm bg-stone-900 text-white'
                      : 'rounded-tl-sm border border-stone-200 bg-white text-stone-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-stone-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap">
                    {message.role === 'assistant'
                      ? renderAssistantContent(message.content)
                      : message.content}
                  </p>
                  {message.vehicles && message.vehicles.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.vehicles.map((vehicle) => (
                        <Link
                          key={vehicle.id}
                          href={`/bicicletas/${vehicle.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="block rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-stone-800 hover:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-stone-100"
                        >
                          {message.showPhotos && vehicle.images.length > 0 && (
                            <span className="mb-2 grid grid-cols-2 gap-1.5">
                              {vehicle.images.slice(0, 4).map((image, imageIndex) => (
                                <span
                                  key={`${vehicle.id}-image-${imageIndex}`}
                                  className="relative aspect-[4/3] overflow-hidden rounded-lg bg-stone-200 dark:bg-neutral-700"
                                >
                                  <Image
                                    src={image}
                                    alt={`${vehicle.title} — foto ${imageIndex + 1}`}
                                    fill
                                    sizes="(max-width: 640px) 40vw, 220px"
                                    className="object-cover"
                                  />
                                </span>
                              ))}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5 text-xs font-semibold">
                            <CarFront className="h-3.5 w-3.5 text-emerald-700" />
                            {vehicle.title}
                          </span>
                          <span className="mt-1 block text-xs">
                            {formatCurrency(vehicle.price)} · {vehicle.mileage.toLocaleString('es-CO')} km
                          </span>
                          <span className="block text-[11px] text-stone-500 dark:text-stone-400">
                            {vehicle.transmission} · {vehicle.fuelType} · {vehicle.city || 'Ubicación por confirmar'}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex items-center gap-2 pl-9 text-xs text-stone-500" role="status">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Revisando el inventario...
              </div>
            )}
            {!assistantEnabled && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                El chat se habilitará cuando el concesionario termine la configuración del
                asistente. Mientras tanto puedes solicitar que un asesor te contacte.
              </p>
            )}
            {error && (
              <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-800">
                {error}
              </p>
            )}
          </div>

          {isContactOpen ? (
            <form onSubmit={handleContactSubmit} className="space-y-2 border-t border-stone-200 p-3 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-stone-900 dark:text-white">Que te contacte un asesor</p>
                <button
                  type="button"
                  onClick={() => setIsContactOpen(false)}
                  className="rounded p-1 text-stone-500 hover:bg-stone-100"
                  aria-label="Volver al chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <input name="name" required maxLength={100} placeholder="Nombre" className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
              <input name="phone" required maxLength={40} placeholder="Teléfono / WhatsApp" className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
              <input name="email" type="email" required maxLength={254} placeholder="Correo electrónico" className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
              <input type="hidden" name="assistantTranscript" value={conversationTranscript} />
              <select name="vehicleId" defaultValue="" className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900">
                <option value={contactVehicleId}>
                  {contactVehicleId
                    ? suggestedVehicles.find((vehicle) => vehicle.id === contactVehicleId)?.title ??
                      'Bicicleta eléctrica seleccionado'
                    : 'Bicicleta eléctrica de interés (opcional)'}
                </option>
                {suggestedVehicles.map((vehicle) => (
                  contactVehicleId !== vehicle.id && (
                    <option key={vehicle.id} value={vehicle.id}>{vehicle.title}</option>
                  )
                ))}
              </select>
              <textarea name="message" defaultValue={contactMessageDraft} maxLength={1000} rows={3} placeholder="¿Qué te gustaría consultar? (opcional)" className="w-full resize-none rounded-lg border border-stone-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
              {contactError && <p role="alert" className="text-xs text-rose-700">{contactError}</p>}
              {contactSent && <p role="status" className="text-xs text-emerald-700">Solicitud enviada correctamente.</p>}
              <p className="text-[10px] leading-relaxed text-stone-500">
                Al enviar, guardaremos estos datos en el CRM para que un asesor te contacte. No se envían a Ollama.
              </p>
              <button
                type="submit"
                disabled={isContactPending}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {isContactPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar solicitud
              </button>
            </form>
          ) : (
            <>
              <form onSubmit={sendMessage} className="border-t border-stone-200 p-3 dark:border-neutral-800">
                {image && (
                  <div className="mb-2 flex items-center justify-between rounded-lg bg-stone-100 px-2.5 py-1.5 text-xs text-stone-600 dark:bg-neutral-800 dark:text-stone-300">
                    <span className="truncate">{image.name}</span>
                    <button type="button" onClick={() => setImage(null)} className="ml-2 text-stone-500" aria-label="Quitar imagen">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <label className={`rounded-lg p-2 text-stone-500 dark:hover:bg-neutral-800 ${assistantEnabled ? 'cursor-pointer hover:bg-stone-100' : 'cursor-not-allowed opacity-50'}`} title="Adjuntar foto del bicicleta eléctrica">
                    <ImagePlus className="h-5 w-5" />
                    <input
                      ref={imageInput}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      disabled={!assistantEnabled}
                      className="sr-only"
                    />
                  </label>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleMessageKeyDown}
                    disabled={!assistantEnabled}
                    maxLength={1500}
                    rows={2}
                    placeholder={assistantEnabled ? 'Cuéntame qué estás buscando...' : 'Chat pendiente de configuración'}
                    aria-label="Tu mensaje"
                    aria-keyshortcuts="Enter"
                    title="Enter envía · Shift+Enter agrega una línea"
                    className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 dark:border-neutral-700 dark:bg-neutral-900"
                  />
                  <button
                    type="submit"
                    disabled={!assistantEnabled || isSending || (!draft.trim() && !image)}
                    className="rounded-xl bg-emerald-700 p-2.5 text-white hover:bg-emerald-800 disabled:opacity-50"
                    aria-label="Enviar mensaje"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-right text-[10px] text-stone-500">
                  Enter envía · Shift+Enter agrega una línea
                </p>
              </form>
              <button
                type="button"
                onClick={() => {
                  setContactError(null)
                  setIsContactOpen(true)
                }}
                className="border-t border-stone-100 px-3 py-2 text-left text-xs font-medium text-emerald-800 hover:bg-emerald-50 dark:border-neutral-800 dark:text-emerald-400 dark:hover:bg-neutral-800"
              >
                {contactSent ? 'Enviar otra solicitud a un asesor' : 'Prefiero que me contacte un asesor'}
              </button>
              <a
                href={whatsappLink('Hola, estoy conversando con Carlos y quisiera continuar mi asesoría sobre un bicicleta eléctrica.')}
                target="_blank"
                rel="noopener noreferrer"
                className="block border-t border-stone-100 px-3 py-2 text-left text-xs font-medium text-emerald-800 hover:bg-emerald-50 dark:border-neutral-800 dark:text-emerald-400 dark:hover:bg-neutral-800"
              >
                Continuar por WhatsApp
              </a>
            </>
          )}
        </section>
      )}

      {variant === 'floating' && (
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="flex h-14 items-center gap-2 rounded-full bg-emerald-700 px-5 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-800"
          aria-label={isOpen ? 'Cerrar asistente de bicicletas eléctricas' : 'Abrir asistente de bicicletas eléctricas'}
        >
          {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
          <span>{isOpen ? 'Cerrar' : 'Asesor IA'}</span>
        </button>
      )}
    </div>
  )
}
