'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

export type PreviewImage = {
  id?: string
  url: string
  alt?: string
}

type BikePreviewProps = {
  images: PreviewImage[]
  altPrefix: string
  sizes?: string
  className?: string
}

const AUTOPLAY_MS = 3000

export default function BikePreview({
  images,
  altPrefix,
  sizes = '33vw',
  className = '',
}: BikePreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Autoplay: rota las fotos si hay más de una
  useEffect(() => {
    if (images.length <= 1) return

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, AUTOPLAY_MS)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [images.length])

  if (images.length === 0) {
    return <div className={`relative w-full overflow-hidden bg-stone-100 dark:bg-neutral-800 ${className}`} />
  }

  return (
    <div className={`relative w-full overflow-hidden bg-stone-100 dark:bg-neutral-800 ${className}`}>
      {images.map((img, idx) => (
        <Image
          key={img.id || idx}
          src={img.url}
          alt={img.alt || `${altPrefix} — foto ${idx + 1}`}
          fill
          sizes={sizes}
          aria-hidden={idx !== currentIndex}
          className={`object-cover transition-opacity duration-700 ease-in-out ${
            idx === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 backdrop-blur-sm">
          {images.map((_, idx) => (
            <span
              key={idx}
              className={`h-1 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-3 bg-white' : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
