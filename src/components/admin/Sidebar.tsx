'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Bike,
  Users,
  MessageSquare,
  Settings,
  ShieldAlert,
  Menu,
  X,
  Zap,
} from 'lucide-react'

interface SidebarProps {
  userRoles: string[]
}

export default function Sidebar({ userRoles }: SidebarProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isSuperAdmin = userRoles.includes('SUPER_ADMIN')
  const isAdminBicicletas = userRoles.includes('ADMIN_VEHICULOS') || isSuperAdmin
  const isAsesor = userRoles.includes('ASESOR_COMERCIAL') || isSuperAdmin

  const navItems = [
    {
      label: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      label: 'Bicicletas eléctricas',
      href: '/admin/bicicletas',
      icon: Bike,
      show: isAdminBicicletas || isAsesor,
    },
    {
      label: 'Leads & WhatsApp',
      href: '/admin/leads',
      icon: MessageSquare,
      show: true,
    },
    {
      label: 'Usuarios y Equipo',
      href: '/admin/usuarios',
      icon: Users,
      show: isSuperAdmin,
    },
    {
      label: 'Configuración',
      href: '/admin/configuracion',
      icon: Settings,
      show: isSuperAdmin,
    },
  ]

  const visibleItems = navItems.filter((item) => item.show)

  const renderNavigation = (onNavigate?: () => void) => (
    <nav className="flex-1 space-y-1 p-4">
      <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#a3a39b]">
        Menú Principal
      </p>
      {visibleItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
              isActive
                ? 'bg-[#ffd51a] font-semibold text-[#0b0b0b] shadow-[0_6px_18px_rgba(255,213,26,0.28)]'
                : 'text-[#a3a39b] hover:bg-white/10 hover:text-[#f5f3ec]'
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )

  const renderBrand = () => (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffd51a] text-[#0b0b0b]">
        <Zap className="h-5 w-5" strokeWidth={2.6} />
      </div>
      <div>
        <h2 className="text-[15px] font-extrabold leading-none tracking-tight text-white">
          BIKE<span className="text-[#ffd51a]">FAST</span>
        </h2>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a3a39b]">
          Electrics · CRM
        </p>
      </div>
    </div>
  )

  const renderRoleBadge = () => (
    <div className="flex items-center gap-2 text-xs text-[#a3a39b]">
      <ShieldAlert className="h-4 w-4 shrink-0 text-[#ffd51a]" />
      <span>
        Rol: <strong className="text-[#f5f3ec]">{userRoles[0] || 'Usuario'}</strong>
      </span>
    </div>
  )

  return (
    <>
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-[#0b0b0b] px-4 text-[#f5f3ec] lg:hidden">
        {renderBrand()}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Abrir menú de navegación"
          aria-expanded={isMobileMenuOpen}
          aria-controls="admin-mobile-navigation"
          className="rounded-lg p-2 text-[#f5f3ec] hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Cerrar menú de navegación"
            className="absolute inset-0 h-full w-full bg-[#0b0b0b]/60 backdrop-blur-sm"
          />
          <aside
            id="admin-mobile-navigation"
            aria-label="Navegación del CRM"
            className="relative flex h-full w-[min(18rem,85vw)] flex-col border-r border-white/10 bg-[#0b0b0b] text-[#f5f3ec] shadow-xl"
          >
            <div className="flex h-16 items-center justify-between border-b border-white/10 bg-black/20 px-5">
              {renderBrand()}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Cerrar menú"
                className="rounded-lg p-2 text-[#f5f3ec] hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderNavigation(() => setIsMobileMenuOpen(false))}
            <div className="border-t border-white/10 bg-black/20 p-4">
              {renderRoleBadge()}
            </div>
          </aside>
        </div>
      )}

      <aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-[#0b0b0b] text-[#f5f3ec] lg:flex">
        <div className="flex h-16 items-center border-b border-white/10 bg-black/20 px-6">
          {renderBrand()}
        </div>
        {renderNavigation()}
        <div className="border-t border-white/10 bg-black/20 p-4">
          {renderRoleBadge()}
        </div>
      </aside>
    </>
  )
}