import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '10.68.89.158',
    '192.168.137.206',
    'goon-savior-designate.ngrok-free.dev',
  ],
  deploymentId: 'auto-propiedades-carlos-20260928',
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      // Imágenes de stock usadas en el catálogo/hero
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Supabase Storage (proyecto de la empresa)
      { protocol: 'https', hostname: 'tchfujgmzuknyfxxsbvo.supabase.co' },
    ],
  },
}

export default nextConfig