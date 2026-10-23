import { prisma } from '@/lib/prisma'

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY no está configurada')

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 768,
    }),
  })

  if (!response.ok) throw new Error(`Error de embeddings: ${response.status}`)
  const data = (await response.json()) as { data?: Array<{ embedding: number[] }> }
  const embedding = data.data?.[0]?.embedding
  if (!embedding) throw new Error('No se pudo generar el embedding')
  return embedding
}

export async function syncVehicleEmbedding(vehicleId: string) {
  const bike = await prisma.vehicle.findUnique({ where: { id: vehicleId } })
  if (!bike) return

  const textRepresentation = `
    Bicicleta eléctrica: ${bike.brand} ${bike.model} ${bike.year}.
    Título: ${bike.title}.
    Categoría: ${bike.vehicleType}, batería: ${bike.battery || 'no confirmada'}, motor: ${bike.motorPower || 'no confirmado'}.
    Precio: $${bike.price} COP, autonomía: ${bike.rangeKm || 'no confirmada'} km, color: ${bike.color}.
    Ubicación: ${bike.city}, ${bike.department}.
    Características: ${bike.features.join(', ')}.
    Descripción: ${bike.description}.
  `.trim()

  const embeddingVector = await generateEmbedding(textRepresentation)
  const vectorSql = `[${embeddingVector.join(',')}]`
  await prisma.documentEmbedding.deleteMany({ where: { vehicleId } })
  await prisma.$executeRaw`
    INSERT INTO "DocumentEmbedding" ("id", "content", "embedding", "vehicleId", "createdAt")
    VALUES (gen_random_uuid(), ${textRepresentation}, ${vectorSql}::vector, ${vehicleId}, NOW())
  `
}

export async function searchSemantic(query: string, limit = 5) {
  try {
    const queryVector = await generateEmbedding(query)
    const vectorSql = `[${queryVector.join(',')}]`
    return await prisma.$queryRaw<Array<{
      id: string
      content: string
      vehicleId: string | null
      similarity: number
    }>>`
      SELECT "id", "content", "vehicleId",
        1 - ("embedding" <=> ${vectorSql}::vector) AS similarity
      FROM "DocumentEmbedding"
      WHERE "embedding" IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM "Vehicle"
          WHERE "Vehicle"."id" = "DocumentEmbedding"."vehicleId"
            AND "Vehicle"."published" = TRUE
            AND "Vehicle"."status" = 'AVAILABLE'
        )
      ORDER BY "embedding" <=> ${vectorSql}::vector
      LIMIT ${limit};
    `
  } catch (error) {
    console.error('Error en búsqueda semántica de bicicletas:', error)
    return []
  }
}
