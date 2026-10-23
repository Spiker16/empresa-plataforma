'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function SmoothScroll() {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    gsap.registerPlugin(ScrollTrigger)

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // los links #bicicletas, #por-que y #asesoria tienen que descontar el header sticky
      anchors: { offset: -80 },
    })

    // Lenis avisa a ScrollTrigger en cada scroll
    lenis.on('scroll', ScrollTrigger.update)

    // GSAP maneja el loop, Lenis lo sigue
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [])

  return null
}