'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import type { RoleType } from '@prisma/client'
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from './actions'
import {
  Users,
  UserPlus,
  Search,
  Shield,
  ShieldAlert,
  Bike,
  UserCheck,
  Mail,
  Phone,
  Edit2,
  Trash2,
  Loader2,
  X,
  KeyRound,
} from 'lucide-react'

type UserItem = {
  id: string
  email: string
  name: string
  phone: string | null
  createdAt: Date
  updatedAt: Date
  roles: { role: { id: string; name: RoleType } }[]
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [isPending, startTransition] = useTransition()

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const res = await getUsers(search, roleFilter)
    if (res.success && res.data) {
      setUsers(res.data)
    }
    setLoading(false)
  }, [search, roleFilter])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchUsers()
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [fetchUsers])

  const handleOpenCreate = () => {
    setEditingUser(null)
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user)
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      startTransition(async () => {
        await deleteUser(id)
        await fetchUsers()
      })
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = editingUser
        ? await updateUser(formData)
        : await createUser(formData)

      if (res.success) {
        setIsModalOpen(false)
        await fetchUsers()
      } else {
        setFormError(res.error || 'Ocurrió un error.')
      }
    })
  }

  const getRoleBadge = (roleName?: string) => {
    switch (roleName) {
      case 'SUPER_ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-[0.08em] bg-[#0b0b0b] text-[#ffd51a]">
            <ShieldAlert className="w-3 h-3" /> Super Admin
          </span>
        )
      case 'ADMIN_VEHICULOS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-[0.08em] bg-[#ffd51a] text-[#0b0b0b]">
            <Bike className="w-3 h-3" /> Admin Bicicletas
          </span>
        )
      case 'ASESOR_COMERCIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-[0.08em] bg-[#ffd51a]/25 text-[#8a6d00]">
            <UserCheck className="w-3 h-3" /> Asesor Comercial
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-[0.08em] bg-black/5 text-[#5d5d57]">
            <Shield className="w-3 h-3" /> Cliente
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="crm-eyebrow">Equipo</span>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0b0b0b] flex items-center gap-2">
            <Users className="w-7 h-7 text-[#0b0b0b]" />
            Usuarios y Equipo
          </h1>
          <p className="mt-1 text-sm text-[#5d5d57]">
            Administra los usuarios registrados y asigna sus roles correspondientes.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="crm-btn crm-btn--primary"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="crm-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a39b]" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="crm-input w-full pl-9"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="crm-select"
        >
          <option value="ALL">Todos los roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="ADMIN_VEHICULOS">Admin Bicicletas eléctricas</option>
          <option value="ASESOR_COMERCIAL">Asesor Comercial</option>
          <option value="CLIENTE">Cliente</option>
        </select>
      </div>

      {/* Tabla de Usuarios */}
      <div className="crm-card overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#5d5d57]">
            <Loader2 className="w-8 h-8 animate-spin text-[#ffd51a] mb-2" />
            <p className="text-sm font-medium">Cargando usuarios...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-[#5d5d57]">
            <Users className="w-12 h-12 text-[#c9c7bd] mx-auto mb-3" />
            <p className="text-base font-extrabold tracking-tight text-[#0b0b0b]">No se encontraron usuarios</p>
            <p className="text-xs text-[#a3a39b] mt-1">Intenta ajustar tus filtros de búsqueda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="crm-table w-full text-left text-sm text-[#5d5d57]">
              <thead>
                <tr>
                  <th className="px-6 py-3.5">Usuario</th>
                  <th className="px-6 py-3.5">Contacto</th>
                  <th className="px-6 py-3.5">Rol Principal</th>
                  <th className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {users.map((user) => {
                  const currentRole = user.roles?.[0]?.role?.name
                  return (
                    <tr key={user.id} className="transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#ffd51a] text-[#0b0b0b] flex items-center justify-center font-extrabold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#0b0b0b]">{user.name}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[#5d5d57]">
                            <Mail className="w-3.5 h-3.5 text-[#a3a39b]" />
                            <span className="text-xs">{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1.5 text-[#5d5d57]">
                              <Phone className="w-3.5 h-3.5 text-[#a3a39b]" />
                              <span className="text-xs">{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">{getRoleBadge(currentRole)}</td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 text-[#5d5d57] hover:text-[#0b0b0b] hover:bg-[#ffd51a]/25 rounded-lg transition-colors"
                            title="Editar Usuario"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={isPending}
                            className="p-1.5 text-[#5d5d57] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Eliminar Usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="crm-modal w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-black/5">
              <h3 className="font-extrabold tracking-tight text-[#0b0b0b] text-lg">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#5d5d57] hover:text-[#0b0b0b] p-1 rounded-lg hover:bg-black/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
                  {formError}
                </div>
              )}

              {editingUser && <input type="hidden" name="id" value={editingUser.id} />}

              <div>
                <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingUser?.name || ''}
                  required
                  placeholder="Ej: Carlos Mendoza"
                  className="crm-input w-full"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingUser?.email || ''}
                  required
                  placeholder="ejemplo@empresa.com"
                  className="crm-input w-full"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-[#a3a39b]" />
                  Contraseña {editingUser && '(Opcional)'}
                </label>
                <input
                  type="password"
                  name="password"
                  required={!editingUser}
                  placeholder={editingUser ? 'Dejar en blanco para no cambiar' : '••••••••'}
                  className="crm-input w-full"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  name="phone"
                  defaultValue={editingUser?.phone || ''}
                  placeholder="+57 300 123 4567"
                  className="crm-input w-full"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5d5d57] uppercase tracking-[0.12em] mb-1">
                  Rol Asignado
                </label>
                <select
                  name="role"
                  defaultValue={editingUser?.roles?.[0]?.role?.name || 'ASESOR_COMERCIAL'}
                  className="crm-select w-full"
                >
                  <option value="ASESOR_COMERCIAL">Asesor Comercial</option>
                  <option value="ADMIN_VEHICULOS">Admin Bicicletas eléctricas</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="CLIENTE">Cliente</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="crm-btn crm-btn--ghost"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="crm-btn crm-btn--primary disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingUser ? 'Guardar Cambios' : 'Crear Usuario'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}