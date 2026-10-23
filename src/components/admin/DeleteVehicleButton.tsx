'use client'

import { useTransition } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteVehicle } from '@/app/admin/bicicletas/actions'

export default function DeleteVehicleButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (confirm('¿Estás seguro de que deseas eliminar esta bicicleta eléctrica?')) {
      startTransition(async () => {
        const res = await deleteVehicle(id)
        if (!res.success) {
          alert(res.error || 'No se pudo eliminar la bicicleta eléctrica.')
        }
      })
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      title="Eliminar bicicleta eléctrica"
      className="p-1.5 rounded-lg text-[#5d5d57] hover:bg-red-50 hover:text-red-600 transition-colors inline-flex disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin text-red-600" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  )
}