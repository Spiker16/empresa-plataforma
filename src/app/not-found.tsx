import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-6 text-center text-stone-900 dark:bg-neutral-950 dark:text-stone-100">
      <p className="text-[13px] font-medium uppercase tracking-[0.15em] text-stone-500">
        Error 404
      </p>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight [font-family:var(--font-fraunces)] sm:text-6xl">
        Página no encontrada
      </h1>
      <p className="mt-4 max-w-md text-base text-stone-600 dark:text-stone-400">
        Lo que buscas no existe o ya no está disponible. Revisa el catálogo de bicicletas
        eléctricas de Bikefast.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-[13px] font-semibold text-stone-50 transition-colors hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>
        <Link
          href="/bicicletas"
          className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-6 py-3 text-[13px] font-semibold text-stone-800 transition-colors hover:border-stone-400 dark:border-neutral-700 dark:text-stone-200"
        >
          Ver bicicletas eléctricas
        </Link>
      </div>
    </div>
  )
}
