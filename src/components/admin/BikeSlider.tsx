'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

type ImageItem = {
  id?: string
  url: string
}

type BikeSliderProps = {
  images?: ImageItem[]
}

export default function BikeSlider({ images = [] }: BikeSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!images || images.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 2500)

    return () => clearInterval(interval)
  }, [images])

  if (!images || images.length === 0) return null

  return (
    <div className="relative w-52 h-32 rounded-xl overflow-hidden border border-black/10 bg-[#0b0b0b] mt-2 shadow-sm group">
      {images.map((img, idx) => (
        <Image
          key={img.id || idx}
          src={img.url}
          alt={`Foto ${idx + 1}`}
          fill
          unoptimized
          sizes="208px"
          className={`object-cover transition-all duration-700 ease-in-out ${
            idx === currentIndex
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-105 pointer-events-none'
          }`}
        />
      ))}

      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10 bg-[#0b0b0b]/50 backdrop-blur-sm px-2 py-1 rounded-full">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'bg-[#ffd51a] w-3' : 'bg-white/40 w-1.5'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}