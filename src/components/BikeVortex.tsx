'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

type Item = { slug: string; image: string; title?: string }

const CARD_W = 168 // ancho base de cada tarjeta en px
const CARD_H = 208 // alto base de cada tarjeta en px
const SPIN_MS = 2600 // duración del giro en espiral
const SETTLE_MS = 1500 // duración del descenso y aterrizaje
const TOTAL = SPIN_MS + SETTLE_MS
const SPIN_TURNS = 2.5 // vueltas completas durante la espiral

export const VORTEX_DONE_EVENT = 'bike-vortex:done'

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export default function BikeVortex({
  bikes,
  delay = 2600,
}: {
  bikes: Item[]
  delay?: number // ms de espera (lo que dura la pantalla de carga)
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const [done, setDone] = useState(false)

  useEffect(() => {
    const finish = () => {
      setDone(true)
      window.dispatchEvent(new CustomEvent(VORTEX_DONE_EVENT))
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || bikes.length === 0) {
      finish()
      return
    }

    let raf = 0
    const timer = window.setTimeout(() => {
      const root = rootRef.current
      if (!root) return
      root.style.visibility = 'visible'

      // El vórtice vive dentro del escenario del hero: giramos alrededor de SU centro,
      // no del centro de la ventana (que en móvil queda muy por encima del escenario).
      const box = root.getBoundingClientRect()
      const cx = box.width / 2
      const cy = box.height / 2
      const size = Math.min(box.width, box.height) || 480

      // Destino: el rect real de la bici del hero, para aterrizar justo encima
      const target = document.querySelector('[data-hero-bike]')?.getBoundingClientRect()
      const tx = target ? target.left + target.width / 2 - box.left : cx
      const ty = target ? target.top + target.height / 2 - box.top : cy
      // Escala de aterrizaje acotada: sin acercamiento exagerado al final
      const endScale = target ? clamp(target.width / CARD_W, 0.6, 1.15) : 1

      const R0 = size * 0.62
      const R1 = size * 0.2
      const spinTotal = Math.PI * 2 * SPIN_TURNS
      const start = performance.now()

      // Cada tarjeta aterriza en un punto distinto alrededor de la bici del hero,
      // así el descenso se lee como una lluvia ordenada y no como un montón encimado.
      const slots = bikes.map((_, i) => {
        const a = (Math.PI * 2 * i) / bikes.length - Math.PI / 2
        const rad = size * 0.34
        return {
          x: tx + Math.cos(a) * rad,
          y: ty + Math.sin(a) * rad * 0.78,
        }
      })

      const frame = (now: number) => {
        const elapsed = now - start
        const p = clamp(elapsed / TOTAL)
        const spin = easeOut(clamp(elapsed / SPIN_MS)) * spinTotal

        bikes.forEach((_, i) => {
          const el = itemRefs.current[i]
          if (!el) return
          const a0 = (Math.PI * 2 * i) / bikes.length
          const slot = slots[i]
          let x: number
          let y: number
          let scale: number
          let opacity: number
          let ang: number
          let depth: number // 0 = al fondo, 1 = al frente

          if (elapsed < SPIN_MS) {
            // Fase 1: espiral que se cierra alrededor del centro del escenario
            const t = easeInOut(clamp(elapsed / SPIN_MS))
            const r = lerp(R0, R1, t)
            ang = a0 + spin
            x = cx + Math.cos(ang) * r
            y = cy + Math.sin(ang) * r * 0.72
            scale = lerp(0.72, 1.12, t)
            opacity = clamp(elapsed / 220)
            depth = (Math.sin(ang) + 1) / 2
          } else {
            // Fase 2: bajan y se desvanecen sobre la bici del hero (sin acercamiento final)
            const q = easeInOut(clamp((elapsed - SPIN_MS) / SETTLE_MS))
            const r = lerp(R1, 0, q)
            ang = a0 + spin
            x = lerp(cx, slot.x, q) + Math.cos(ang) * r
            y = lerp(cy, slot.y, q) + Math.sin(ang) * r * 0.72
            scale = lerp(1.12, endScale, q)
            opacity = 1 - q
            depth = lerp((Math.sin(ang) + 1) / 2, 1, q)
          }

          // Profundidad real: las tarjetas del fondo se alejan, se giran y se atenúan
          const z = (depth - 0.5) * 2 // -1 .. 1
          const zShift = z * 240
          const rotY = -Math.cos(ang) * 62 * (1 - Math.abs(z) * 0.2)
          const rotX = Math.sin(ang) * 18
          const depthScale = 0.86 + depth * 0.3
          const depthOpacity = 0.72 + depth * 0.28
          const blur = (1 - depth) * 1.1

          el.style.opacity = String(opacity * depthOpacity)
          el.style.zIndex = String(Math.round(depth * 100))
          el.style.filter = blur > 0.15 ? `blur(${blur.toFixed(2)}px)` : 'none'
          el.style.transform =
            `translate3d(${x - CARD_W / 2}px, ${y - CARD_H / 2}px, ${zShift}px) ` +
            `rotateY(${rotY}deg) rotateX(${rotX}deg) rotateZ(${z * 5}deg) scale(${scale * depthScale})`
        })

        if (p < 1) raf = requestAnimationFrame(frame)
        else finish()
      }

      raf = requestAnimationFrame(frame)
    }, delay)

    return () => {
      window.clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [bikes, delay])

  if (done) return null

  return (
    <div ref={rootRef} className="vortex" aria-hidden="true" style={{ visibility: 'hidden' }}>
      {bikes.map((bike, i) => (
        <div
          key={bike.slug}
          className="vortex-item"
          ref={(el) => {
            itemRefs.current[i] = el
          }}
          style={{ width: CARD_W, height: CARD_H, opacity: 0 }}
        >
          <div className={`vcard${i % 3 === 0 ? ' vcard--alt' : ''}`}>
            <div className="vcard-top">
              <span>{String(i + 1).padStart(2, '0')}</span>
              <span className="vcard-tag">Disponible</span>
            </div>
            <div className="vcard-stage">
              <Image src={bike.image} alt="" fill sizes="168px" className="vcard-img" />
            </div>
            <div className="vcard-name">{bike.title ?? 'Bike Fast'}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
