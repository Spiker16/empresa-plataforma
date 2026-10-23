import { NextResponse } from 'next/server'
import { searchSemantic } from '@/lib/ai/embeddings'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { query } = (await req.json()) as { query?: string }
    if (!query?.trim() || query.length > 500) {
      return NextResponse.json({ error: 'La consulta no es válida' }, { status: 400 })
    }

    const matches = await searchSemantic(query, 5)
    const vehicleIds = matches.map((match) => match.vehicleId).filter(Boolean) as string[]
    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: vehicleIds }, published: true, status: 'AVAILABLE' },
      include: { media: { take: 1 } },
    })

    return NextResponse.json({
      success: true,
      matches: matches.map(({ id, vehicleId, similarity }) => ({ id, vehicleId, similarity })),
      data: { vehicles },
    })
  } catch (error) {
    console.error('API Search Error:', error)
    return NextResponse.json({ error: 'Error en la búsqueda' }, { status: 500 })
  }
}
