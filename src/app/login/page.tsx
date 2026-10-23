'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (res?.error) {
      setError('Credenciales inválidas. Revisa tu correo y contraseña.')
      setLoading(false)
    } else {
      router.push('/admin/dashboard')
      router.refresh()
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f3ec] px-4 py-10 text-[#0b0b0b]">
      <div className="w-full max-w-md rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(11,11,11,.12)] sm:p-10">
        <div className="text-center">
          <Link href="/" className="mx-auto mb-6 flex w-fit flex-col items-start font-bold leading-none tracking-tight">
            <span className="rounded bg-[#ffd51a] px-2 py-1 text-lg">BIKE FAST</span>
            <span className="mt-1 text-xs tracking-[.18em]">ELECTRIC</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Acceso CRM</h1>
          <p className="mt-2 text-sm text-[#5d5d57]">Gestiona el catálogo y tus leads Bikefast.</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-black/15 px-3 py-3 text-[#0b0b0b] outline-none focus:border-[#ffd51a] focus:ring-2 focus:ring-[#ffd51a]/40"
              placeholder="correo@bikefast.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-black/15 px-3 py-3 text-[#0b0b0b] outline-none focus:border-[#ffd51a] focus:ring-2 focus:ring-[#ffd51a]/40"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#ffd51a] px-4 py-3 font-bold transition hover:brightness-105 disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Ingresar al CRM'}
          </button>
        </form>
        <Link href="/" className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-[#5d5d57] hover:text-[#0b0b0b]">
          <ArrowLeft className="h-4 w-4" /> Volver a Bikefast
        </Link>
      </div>
    </main>
  )
}