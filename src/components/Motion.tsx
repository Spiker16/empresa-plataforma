'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { VORTEX_DONE_EVENT } from './BikeVortex'

type Flag = Window & { __bfMotion?: boolean }

export default function Motion() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.bike')
    if (!root) return

    // Movimiento reducido: sin animaciones, el contenido queda visible tal cual
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.classList.remove('js-motion')
      return
    }

    gsap.registerPlugin(ScrollTrigger, SplitText)
    ;(window as Flag).__bfMotion = true

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const cleanups: Array<() => void> = []
    const on = (target: EventTarget, type: string, fn: (e: Event) => void) => {
      target.addEventListener(type, fn)
      cleanups.push(() => target.removeEventListener(type, fn))
    }
    const all = (selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector))

    // ---- Intro: inicia cuando el contenido ya está hidratado ----
    let introDone = false
    const queue: Array<() => void> = []
    const onIntro = (fn: () => void) => {
      if (introDone) fn()
      else queue.push(fn)
    }
    const runIntro = () => {
      if (introDone) return
      introDone = true
      queue.splice(0).forEach((fn) => fn())
    }

    const id = window.setTimeout(runIntro, 60)
    cleanups.push(() => window.clearTimeout(id))

    const ctx = gsap.context(() => {
      // ---- Titular del hero: líneas con máscara ----
      all('[data-split="hero"]').forEach((el) => {
        SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit(self) {
            gsap.set(el, { visibility: 'visible' })
            const tween = gsap.from(self.lines, {
              yPercent: 115,
              duration: 1.25,
              ease: 'expo.out',
              stagger: 0.1,
              paused: !introDone,
            })
            if (!introDone) onIntro(() => tween.play())
            return tween
          },
        })
      })

      // ---- Otros titulares: entran por líneas al hacer scroll ----
      all('[data-split]:not([data-split="hero"])').forEach((el) => {
        SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit(self) {
            gsap.set(el, { visibility: 'visible' })
            return gsap.from(self.lines, {
              yPercent: 115,
              duration: 1.1,
              ease: 'expo.out',
              stagger: 0.09,
              scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            })
          },
        })
      })

      // ---- Texto que se ilumina palabra por palabra con el scroll ----
      all('[data-words]').forEach((el) => {
        SplitText.create(el, {
          type: 'words',
          autoSplit: true,
          onSplit(self) {
            gsap.set(el, { visibility: 'visible' })
            return gsap.fromTo(
              self.words,
              { opacity: 0.16 },
              {
                opacity: 1,
                ease: 'none',
                stagger: 0.12,
                scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 50%', scrub: true },
              }
            )
          },
        })
      })

      // ---- Reveal genérico ----
      all('[data-reveal]').forEach((el) => {
        gsap.fromTo(
          el,
          { y: 56, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.1,
            ease: 'expo.out',
            delay: Number(el.dataset.delay || 0),
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          }
        )
      })

      // ---- Líneas que se dibujan ----
      all('[data-line]').forEach((el) => {
        gsap.fromTo(
          el,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1.4,
            ease: 'expo.out',
            transformOrigin: 'left center',
            scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          }
        )
      })

      // ---- Contadores ----
      const runCount = (el: HTMLElement) => {
        const end = Number(el.dataset.count || 0)
        const state = { v: 0 }
        el.textContent = '0'
        gsap.to(state, {
          v: end,
          duration: 1.8,
          ease: 'power3.out',
          onUpdate: () => {
            el.textContent = String(Math.round(state.v))
          },
        })
      }
      all('[data-count]').forEach((el) => {
        const final = el.textContent
        if (el.hasAttribute('data-count-wait')) {
          el.textContent = '0'
          onIntro(() => runCount(el))
        } else {
          ScrollTrigger.create({
            trigger: el,
            start: 'top 92%',
            once: true,
            onEnter: () => runCount(el),
          })
        }
        // si algo falla, el valor final queda en el DOM
        cleanups.push(() => {
          el.textContent = final
        })
      })

      // ---- Parallax y texto gigante que se desplaza ----
      all('[data-parallax]').forEach((el) => {
        const v = Number(el.dataset.parallax || 10)
        gsap.fromTo(
          el,
          { yPercent: -v },
          {
            yPercent: v,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
          }
        )
      })
      all('[data-drift]').forEach((el) => {
        gsap.to(el, {
          xPercent: Number(el.dataset.drift || -15),
          ease: 'none',
          scrollTrigger: {
            trigger: el.parentElement,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        })
      })

      // ---- Marquee que se acelera con la velocidad del scroll ----
      all('[data-marquee]').forEach((m) => {
        const track = m.querySelector<HTMLElement>('[data-marquee-track]')
        if (!track) return
        const dir = Number(m.dataset.marqueeDir || 1)
        const loop = gsap.fromTo(
          track,
          { xPercent: dir > 0 ? 0 : -50 },
          { xPercent: dir > 0 ? -50 : 0, duration: 34, ease: 'none', repeat: -1 }
        )
        ScrollTrigger.create({
          trigger: m,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => {
            const boost = Math.min(Math.abs(self.getVelocity()) / 260, 6)
            loop.timeScale(1 + boost)
            gsap.to(loop, { timeScale: 1, duration: 0.9, overwrite: true })
          },
        })
      })

      // ---- Catálogo con scroll horizontal (solo escritorio) ----
      const mm = gsap.matchMedia()
      mm.add('(min-width: 1024px)', () => {
        const wrap = root.querySelector<HTMLElement>('[data-hscroll]')
        const track = root.querySelector<HTMLElement>('[data-hscroll-track]')
        if (!wrap || !track) return
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth)
        gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: wrap,
            start: 'top top+=72',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        })
      })
      cleanups.push(() => mm.revert())

      // ---- Intro del hero: espera a que el vórtice aterrice la bici ----
      onIntro(() => {
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
        tl.fromTo(all('[data-header]'), { yPercent: -100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1 }, 0)
          .fromTo(
            all('[data-hero-disc]'),
            { scale: 0.45, opacity: 0, rotate: -25 },
            { scale: 1, opacity: 1, rotate: 0, duration: 1.7 },
            0
          )
          .fromTo(
            all('[data-hero-fade]'),
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, stagger: 0.08 },
            0.35
          )

        // La bici real aparece justo cuando el vórtice termina de acomodarla
        const revealBike = () => {
          gsap.fromTo(
            all('[data-hero-bike]'),
            { opacity: 0, scale: 0.96 },
            { opacity: 1, scale: 1, duration: 0.7, ease: 'power2.out' }
          )
        }
        let revealed = false
        const once = () => {
          if (revealed) return
          revealed = true
          revealBike()
        }
        window.addEventListener(VORTEX_DONE_EVENT, once, { once: true })
        cleanups.push(() => window.removeEventListener(VORTEX_DONE_EVENT, once))
        // Respaldo por si el vórtice no llega a disparar el evento
        const fallback = window.setTimeout(once, 7000)
        cleanups.push(() => window.clearTimeout(fallback))
      })

      // ---- Flotación continua de la bici ----
      all('[data-float]').forEach((el) => {
        gsap.to(el, { y: -14, rotation: 1.2, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 })
      })

      // ---- Cursor, tilt del hero y botones magnéticos (solo con mouse) ----
      if (finePointer) {
        const hero = root.querySelector<HTMLElement>('[data-hero]')
        if (hero) {
          const layers = all('[data-depth]').map((el) => ({
            depth: Number(el.dataset.depth || 1),
            x: gsap.quickTo(el, 'x', { duration: 1.1, ease: 'power3' }),
            y: gsap.quickTo(el, 'y', { duration: 1.1, ease: 'power3' }),
          }))
          on(hero, 'mousemove', (e) => {
            const m = e as MouseEvent
            const r = hero.getBoundingClientRect()
            const nx = (m.clientX - r.left) / r.width - 0.5
            const ny = (m.clientY - r.top) / r.height - 0.5
            layers.forEach((l) => {
              l.x(nx * -44 * l.depth)
              l.y(ny * -30 * l.depth)
            })
          })
        }

        all('[data-magnetic]').forEach((el) => {
          const strength = Number(el.dataset.magnetic) || 0.35
          on(el, 'mousemove', (e) => {
            const m = e as MouseEvent
            const r = el.getBoundingClientRect()
            gsap.to(el, {
              x: (m.clientX - (r.left + r.width / 2)) * strength,
              y: (m.clientY - (r.top + r.height / 2)) * strength,
              duration: 0.4,
              ease: 'power3.out',
              overwrite: 'auto',
            })
          })
          on(el, 'mouseleave', () => {
            gsap.to(el, { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1,.35)', overwrite: 'auto' })
          })
        })

        const cursor = cursorRef.current
        const label = labelRef.current
        if (cursor && label) {
          root.classList.add('has-cursor')
          cleanups.push(() => root.classList.remove('has-cursor'))
          gsap.set(cursor, { xPercent: -50, yPercent: -50, scale: 0.12, opacity: 0 })
          let shown = false
          let xTo: ReturnType<typeof gsap.quickTo> | null = null
          let yTo: ReturnType<typeof gsap.quickTo> | null = null

          on(window, 'mousemove', (e) => {
            const m = e as MouseEvent
            if (!shown) {
              shown = true
              gsap.set(cursor, { x: m.clientX, y: m.clientY })
              xTo = gsap.quickTo(cursor, 'x', { duration: 0.45, ease: 'power3' })
              yTo = gsap.quickTo(cursor, 'y', { duration: 0.45, ease: 'power3' })
              gsap.to(cursor, { opacity: 1, duration: 0.3 })
            }
            xTo?.(m.clientX)
            yTo?.(m.clientY)
          })
          on(document, 'mouseover', (e) => {
            const target = (e.target as Element | null)?.closest('[data-cursor],a,button')
            const text = target?.getAttribute('data-cursor')
            if (text) {
              label.textContent = text
              gsap.to(cursor, { scale: 1, duration: 0.45, ease: 'power3.out', overwrite: 'auto' })
            } else if (target) {
              label.textContent = ''
              gsap.to(cursor, { scale: 0.38, duration: 0.35, ease: 'power3.out', overwrite: 'auto' })
            } else {
              label.textContent = ''
              gsap.to(cursor, { scale: 0.12, duration: 0.35, ease: 'power3.out', overwrite: 'auto' })
            }
          })
          on(document, 'mouseleave', () => {
            gsap.to(cursor, { opacity: 0, duration: 0.2 })
            shown = false
          })
        }
      }

      // Recalcula posiciones cuando carguen imágenes y fuentes
      on(window, 'load', () => ScrollTrigger.refresh())
      document.fonts?.ready.then(() => ScrollTrigger.refresh())
    }, root)

    return () => {
      ctx.revert()
      cleanups.forEach((fn) => fn())
    }
  }, [])

  return (
    <div ref={cursorRef} className="bf-cursor" aria-hidden="true">
      <span ref={labelRef} />
    </div>
  )
}