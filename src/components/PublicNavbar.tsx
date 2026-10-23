import Link from 'next/link'
import { Bike, Sparkles, UserCheck } from 'lucide-react'

export default function PublicNavbar() {
  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <span>Bikefast Electrics</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            href="/#catalogo"
            className="hover:text-blue-400 transition-colors flex items-center gap-1.5"
          >
            <Bike className="w-4 h-4 text-slate-400" />
            Bicicletas
          </Link>

          <Link
            href="/login"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-1.5 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Acceso CRM
          </Link>
        </nav>
      </div>
    </header>
  )
}