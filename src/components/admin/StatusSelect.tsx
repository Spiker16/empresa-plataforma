'use client'

import { useTransition } from 'react'
import { ListingStatus } from '@prisma/client'
import { updateVehicleStatus } from '@/app/admin/bicicletas/actions'
import { Loader2 } from 'lucide-react'

interface StatusSelectProps {
  id: string
  currentStatus: ListingStatus
}

export default function StatusSelect({ id, currentStatus }: StatusSelectProps) {
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as ListingStatus
    if (newStatus === currentStatus) return

    startTransition(async () => {
      const res = await updateVehicleStatus(id, newStatus)
      if (!res.success) {
        alert(res.error || 'No se pudo actualizar el estado.')
      }
    })
  }

  const getBadgeStyle = (status: ListingStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-[#ffd51a] text-[#0b0b0b] border-[#ffd51a]'
      case 'RESERVED':
        return 'bg-[#0b0b0b] text-[#ffd51a] border-[#0b0b0b]'
      case 'SOLD':
        return 'bg-black/5 text-[#5d5d57] border-black/10'
      default:
        return 'bg-black/5 text-[#5d5d57] border-black/10'
    }
  }

  return (
    <div className="relative inline-flex items-center">
      <select
        value={currentStatus}
        onChange={handleChange}
        disabled={isPending}
        className={`text-xs font-bold px-3 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#ffd51a]/60 transition-colors ${getBadgeStyle(
          currentStatus
        )} disabled:opacity-50`}
      >
        <option value="AVAILABLE" className="bg-white text-[#0b0b0b] font-medium">
          Disponible
        </option>
        <option value="RESERVED" className="bg-white text-[#0b0b0b] font-medium">
          Reservado
        </option>
        <option value="SOLD" className="bg-white text-[#0b0b0b] font-medium">
          Vendido
        </option>
      </select>

      {isPending && (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#5d5d57] absolute -right-5" />
      )}
    </div>
  )
}