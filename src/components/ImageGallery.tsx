'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type GalleryImage = {
  id?: string
  url: string
  alt?: string
}

type ImageGalleryProps = {
  images: GalleryImage[]
  altPrefix: string
}

const AUTOPLAY_MS = 3500

export default function ImageGallery({ images, altPrefix }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback(
    (idx: number) => {
      setCurrentIndex((idx + images.length) % images.length)
    },
    [images.length],
  )

  const next = useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex])
  const prev = useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex])

  // Autoplay: avanza automáticamente si hay más de una imagen
  useEffect(() => {
    if (images.length <= 1) return

    timerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, AUTOPLAY_MS)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [images.length])

  // Reinicia el temporizador cuando el usuario navega manualmente
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (images.length <= 1) return
    timerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, AUTOPLAY_MS)
  }, [images.length])

  const handlePrev = useCallback(() => {
    prev()
    resetTimer()
  }, [prev, resetTimer])

  const handleNext = useCallback(() => {
    next()
    resetTimer()
  }, [next, resetTimer])

  const handleGoTo = useCallback(
    (idx: number) => {
      goTo(idx)
      resetTimer()
    },
    [goTo, resetTimer],
  )

  if (images.length === 0) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-stone-200 dark:bg-neutral-900" />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Imagen principal */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-stone-200 dark:bg-neutral-900">
        {images.map((img, idx) => (
          <Image
            key={img.id || idx}
            src={img.url}
            alt={img.alt || `${altPrefix} — foto ${idx + 1}`}
            fill
            priority={idx === 0}
            sizes="(max-width: 1024px) 100vw, 60vw"
            aria-hidden={idx !== currentIndex}
            className={`object-cover transition-opacity duration-700 ease-in-out ${
              idx === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Foto siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur-sm">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Miniaturas */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => handleGoTo(idx)}
              aria-label={`Ver foto ${idx + 1}`}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                idx === currentIndex
                  ? 'border-[#B5502E]'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <Image
                src={img.url}
                alt={`${altPrefix} — miniatura ${idx + 1}`}
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
