import { signOut } from '@/lib/auth'
import { LogOut, User } from 'lucide-react'

interface HeaderProps {
  userName?: string | null
  userEmail?: string | null
}

export default function Header({ userName, userEmail }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-black/10 bg-[#f5f3ec]/90 px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <span className="hidden text-[11px] font-bold uppercase tracking-[0.16em] text-[#5d5d57] sm:inline">
          Bienvenido de nuevo,
        </span>
        <span className="truncate text-sm font-extrabold tracking-tight text-[#0b0b0b] sm:max-w-48">
          {userName || 'Administrador'}
        </span>
      </div>

      <div className="ml-3 flex shrink-0 items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-3 border-r border-black/10 pr-2 sm:pr-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ffd51a] text-sm font-bold text-[#0b0b0b] shadow-[0_4px_12px_rgba(255,213,26,0.4)]">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-[#0b0b0b]">{userName}</p>
            <p className="text-[11px] text-[#5d5d57]">{userEmail}</p>
          </div>
        </div>

        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: '/login' })
          }}
        >
          <button
            type="submit"
            className="flex items-center gap-2 rounded-full border border-black/10 px-2 py-1.5 text-sm font-semibold text-[#5d5d57] transition-all duration-300 hover:-translate-y-px hover:border-black/25 hover:text-[#0b0b0b] sm:px-3"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </form>
      </div>
    </header>
  )
}