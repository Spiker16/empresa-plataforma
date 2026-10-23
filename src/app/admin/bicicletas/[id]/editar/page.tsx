import { notFound } from 'next/navigation'
import VehicleForm from '@/components/admin/VehicleForm'
import { getVehicleById } from '@/app/admin/bicicletas/actions'

type PageProps = { params: Promise<{ id: string }> }

export default async function EditarBicicletaPage({ params }: PageProps) {
  const { id } = await params
  const result = await getVehicleById(id)
  if (!result.success || !result.data) notFound()
  return <VehicleForm initialData={result.data} isEditing />
}
