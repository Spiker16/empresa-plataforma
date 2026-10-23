'use client'

import { useCallback, useEffect, useId, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'bf-cookie-consent'
const OPEN_EVENT = 'bf-open-cookies'
const CHANGE_EVENT = 'bf-consent-change'
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 365 // se vuelve a preguntar cada año

export type Consent = {
  v: 1
  analytics: boolean
  marketing: boolean
  ts: number
}

/**
 * Lee la decisión guardada. Úsala antes de cargar cualquier script de terceros:
 *   if (getConsent()?.analytics) { ...cargar Google Analytics... }
 * Y escucha window 'bf-consent-change' para reaccionar cuando el usuario cambie de opinión.
 */
export function getConsent(): Consent | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Consent
    if (parsed.v !== 1 || Date.now() - parsed.ts > MAX_AGE_MS) return null
    return parsed
  } catch {
    return null
  }
}

function saveConsent(analytics: boolean, marketing: boolean) {
  const value: Consent = { v: 1, analytics, marketing, ts: Date.now() }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Si el navegador bloquea el almacenamiento, la elección solo vale para esta visita.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: value }))
}

/** Botón para el pie de página: vuelve a abrir el aviso y permite cambiar la elección. */
export function CookieSettingsButton({
  className,
  children = 'Configurar cookies',
}: {
  className?: string
  children?: ReactNode
}) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>
      {children}
    </button>
  )
}

const css = `
.bf-consent{position:fixed;left:50%;bottom:16px;z-index:100;width:min(720px,calc(100vw - 32px));max-height:calc(100svh - 32px);overflow:auto;transform:translateX(-50%);border:1px solid var(--line,rgba(11,11,11,.14));border-radius:28px;background:var(--surface,#fff);color:var(--ink,#0b0b0b);padding:22px;box-shadow:0 24px 60px rgba(0,0,0,.28);font-family:var(--f-body),system-ui,sans-serif;animation:bf-consent-in .45s cubic-bezier(.22,1,.36,1) both}
.bf-consent,.bf-consent *{cursor:auto}
.bf-consent button,.bf-consent label{cursor:pointer}
.bf-consent__title{font-family:var(--f-display),var(--f-body),sans-serif;font-size:1.35rem;font-weight:800;letter-spacing:-.03em;line-height:1.1}
.bf-consent__text{margin-top:8px;font-size:14px;line-height:1.55;color:var(--mute,#5d5d57)}
.bf-consent__list{display:grid;gap:10px;margin-top:16px}
.bf-consent__row{display:flex;align-items:flex-start;gap:12px;border:1px solid var(--line,rgba(11,11,11,.14));border-radius:18px;padding:12px 14px}
.bf-consent__row input{margin-top:3px;width:18px;height:18px;flex:none;accent-color:var(--y,#ffd51a)}
.bf-consent__row strong{display:block;font-size:14px;font-weight:800}
.bf-consent__row span{display:block;margin-top:2px;font-size:13px;line-height:1.45;color:var(--mute,#5d5d57)}
.bf-consent__actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.bf-consent__btn{flex:1 1 150px;border:2px solid var(--ink,#0b0b0b);border-radius:999px;padding:12px 18px;background:transparent;color:var(--ink,#0b0b0b);font:inherit;font-size:14px;font-weight:800;letter-spacing:-.01em;transition:filter .2s,background .2s}
.bf-consent__btn:hover{background:color-mix(in srgb,var(--ink,#0b0b0b) 8%,transparent)}
.bf-consent__btn--primary{border-color:var(--y,#ffd51a);background:var(--y,#ffd51a);color:#0b0b0b}
.bf-consent__btn--primary:hover{background:var(--y,#ffd51a);filter:brightness(1.06)}
.bf-consent__btn:focus-visible,.bf-consent__row input:focus-visible{outline:3px solid var(--ink,#0b0b0b);outline-offset:2px}
@keyframes bf-consent-in{from{opacity:0;transform:translate(-50%,16px)}to{opacity:1;transform:translate(-50%,0)}}
@media (prefers-reduced-motion:reduce){.bf-consent{animation:none}}
`

export default function CookieConsent() {
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const titleId = useId()

  useEffect(() => {
    const current = getConsent()
    if (current) {
      setAnalytics(current.analytics)
      setMarketing(current.marketing)
    } else {
      setOpen(true)
    }

    const reopen = () => {
      const saved = getConsent()
      setAnalytics(Boolean(saved?.analytics))
      setMarketing(Boolean(saved?.marketing))
      setCustom(true)
      setOpen(true)
    }
    window.addEventListener(OPEN_EVENT, reopen)
    return () => window.removeEventListener(OPEN_EVENT, reopen)
  }, [])

  const decide = useCallback((a: boolean, m: boolean) => {
    saveConsent(a, m)
    setOpen(false)
    setCustom(false)
  }, [])

  if (!open) return null

  return (
    <section className="bf-consent" role="region" aria-labelledby={titleId} aria-label="Aviso de cookies">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <h2 id={titleId} className="bf-consent__title">
        Tu privacidad, tu decisión
      </h2>
      <p className="bf-consent__text">
        Usamos cookies necesarias para que el sitio funcione y recordar tus preferencias. Si lo permites, también usamos
        cookies de analítica y marketing para mejorar tu experiencia. Puedes cambiar tu elección cuando quieras desde el pie
        de página.
      </p>

      {custom && (
        <div className="bf-consent__list">
          <label className="bf-consent__row">
            <input type="checkbox" checked disabled readOnly />
            <div>
              <strong>Necesarias</strong>
              <span>Hacen que la página cargue y funcione bien. Siempre activas.</span>
            </div>
          </label>
          <label className="bf-consent__row">
            <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
            <div>
              <strong>Analítica</strong>
              <span>Nos ayudan a entender qué secciones se visitan para mejorar el sitio.</span>
            </div>
          </label>
          <label className="bf-consent__row">
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
            <div>
              <strong>Marketing</strong>
              <span>Permiten mostrarte anuncios y ofertas relacionadas con las bicicletas que te interesan.</span>
            </div>
          </label>
        </div>
      )}

      <div className="bf-consent__actions">
        <button type="button" className="bf-consent__btn" onClick={() => decide(false, false)}>
          Solo necesarias
        </button>
        {custom ? (
          <button type="button" className="bf-consent__btn" onClick={() => decide(analytics, marketing)}>
            Guardar selección
          </button>
        ) : (
          <button type="button" className="bf-consent__btn" onClick={() => setCustom(true)}>
            Personalizar
          </button>
        )}
        <button type="button" className="bf-consent__btn bf-consent__btn--primary" onClick={() => decide(true, true)}>
          Aceptar todas
        </button>
      </div>
    </section>
  )
}