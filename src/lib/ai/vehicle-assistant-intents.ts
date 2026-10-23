export type VehicleSearchCriteria = {
  bodyType?: string
  transmission?: string
  fuelType?: string
  maxBudget?: number
  minYear?: number
  exactYear?: number
  maxMileage?: number
  identityTokens: string[]
}

const STOP_WORDS = new Set([
  'busco', 'quiero', 'tengo', 'para', 'con', 'una', 'uno', 'unos', 'unas',
  'que', 'del', 'por', 'como', 'esta', 'este', 'muy', 'mas', 'menos', 'carro',
  'vehiculo', 'vehiculos', 'disponible', 'disponibles', 'hola', 'buenas',
  'hay', 'tiene', 'tienen', 'tienes', 'actualmente', 'ahora', 'opciones',
  'mostrar', 'muestrame', 'muestreme', 'foto', 'fotos', 'imagen', 'imagenes',
  'ver', 'precio', 'precios', 'vale', 'cuesta', 'valor',
  'cuanto', 'autonomía', 'kilometro', 'kilometros',
  'comprar', 'compra', 'buscando', 'opcion', 'opciones', 'me', 'mi', 'un',
  'con', 'del', 'por', 'en', 'ciudad', 'manejo', 'presupuesto', 'maximo',
  'maxima', 'hasta', 'menos', 'millon', 'millones', 'cop', 'pesos', 'ano',
  'desde', 'adelante', 'automatico', 'automatica', 'mecanico', 'mecanica',
  'manual', 'gasolina', 'diesel', 'hibrido', 'electrico', 'suv',
  'bicicleta', 'bicicletas', 'automovil', 'automoviles', 'sedan', 'sedanes',
  'hatchback', 'hatchbacks', 'bicicleta', 'bicicletas', 'camion', 'camiones',
  'bicicletas', 'bicicletas', 'coches', 'usado', 'usada', 'usados', 'usadas',
  'la', 'el', 'los', 'las', 'de', 'y', 'a', 'al', 'se', 'es', 'lo',
  'gusta', 'gustan', 'modelo', 'modelos', 'marca', 'marcas', 'version',
  'versiones', 'cual', 'cuales', 'interesa', 'interesan', 'esa', 'ese',
  'agendar', 'agenda', 'agendo', 'cita', 'citas', 'visita', 'visitar',
  'verlo', 'verla', 'verlos', 'verlas', 'conocerlo', 'conocerla',
  'probarlo', 'probarla', 'prueba', 'manejo', 'horario', 'fecha',
  'reservar', 'reservarlo', 'reservarla', 'disponibilidad', 'disponible',
  'gracias', 'porfavor', 'favor', 'ayuda', 'informacion', 'conocer',
  'conocerlo', 'conocerla', 'visitar', 'probar',
  'primero', 'primera', 'segundo', 'segunda', 'tercero', 'tercera',
  'agendemos', 'agendarme', 'muestrame', 'muestreme', 'ensename',
  'enseneme', 'buscame', 'encuentrame', 'marca', 'marcas', 'palos',
  'muestras', 'muestren', 'muestra', 'algo', 'alrededor', 'cerca',
  'disponibles', 'disponible',
])

function normalizeQuery(query: string): string {
  return query
    .toLocaleLowerCase('es-CO')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

export function extractVehicleSearchCriteria(
  query: string
): VehicleSearchCriteria {
  const normalizedQuery = normalizeQuery(query)
  const criteria: VehicleSearchCriteria = { identityTokens: [] }
  const millionMatch = normalizedQuery.match(
    /(?:presupuesto(?:\s+maximo)?(?:\s+de)?|hasta|maximo|tope(?:\s+de)?|menos\s+de|por\s+debajo\s+de)?\s*\$?\s*(\d+(?:[.,]\d+)?)(?:\s*millones?|\s+palos|\s*m(?:\b|$))/
  )
  if (millionMatch) {
    criteria.maxBudget =
      Number(millionMatch[1].replace(',', '.')) * 1_000_000
  } else {
    const shorthandMillionMatch = normalizedQuery.match(
      /(?:\b(?:la|el|uno|una|opcion)\s+(?:de|por)|\b(?:hasta|presupuesto(?:\s+de)?|tope(?:\s+de)?)\s*)\s*\$?\s*(\d{1,3})(?:\b|$)/
    )
    if (shorthandMillionMatch) {
      criteria.maxBudget = Number(shorthandMillionMatch[1]) * 1_000_000
    }

    const currencyMatch = normalizedQuery.match(
      /(?:presupuesto|precio|valor|cuesta|vale|hasta|maximo|tope|(?:la|el|uno|una)\s+(?:de|por))[^0-9]{0,12}\$?\s*(\d{1,3}(?:[.,]\d{3})+|\d{7,})(?:\s*(?:cop|pesos))?\b|\$\s*(\d{1,3}(?:[.,]\d{3})+|\d{7,})\b/
    )
    const amount = currencyMatch?.[1] || currencyMatch?.[2]
    if (amount && criteria.maxBudget === undefined) {
      criteria.maxBudget = Number(amount.replace(/[.,]/g, ''))
    }

    const shortAmountMatch = normalizedQuery.match(/\bpor\s+(\d{1,3})\b/)
    if (shortAmountMatch && criteria.maxBudget === undefined) {
      criteria.maxBudget = Number(shortAmountMatch[1]) * 1_000_000
    }
  }

  if (/\b(carga|carguera)\b/.test(normalizedQuery)) {
    criteria.bodyType = 'BICICLETA_CARGA'
  } else if (/\b(montana)\b/.test(normalizedQuery)) {
    criteria.bodyType = 'BICICLETA_MONTANA'
  } else if (/\b(urbana|ciudad)\b/.test(normalizedQuery)) {
    criteria.bodyType = 'BICICLETA_URBANA'
  } else if (/\b(electrica|ebike|bici|bicicleta)\b/.test(normalizedQuery)) {
    criteria.bodyType = 'BICICLETA_ELECTRICA'
  }

  if (/\b(acelerador)\b/.test(normalizedQuery)) {
    criteria.transmission = 'ACELERADOR'
  } else if (/\b(pedal|asistencia)\b/.test(normalizedQuery)) {
    criteria.transmission = 'ASISTENCIA_PEDAL'
  }

  if (/\b(electrico|electrica|bateria)\b/.test(normalizedQuery)) {
    criteria.fuelType = 'ELECTRICO'
  }

  const yearMatch = normalizedQuery.match(/\b(19[89]\d|20[0-3]\d)\b/)
  if (yearMatch) {
    const year = Number(yearMatch[1])
    if (/\b(desde|a partir de|minimo|en adelante|o mas)\b/.test(normalizedQuery)) {
      criteria.minYear = year
    } else {
      criteria.exactYear = year
    }
  }

  const mileageMatch = normalizedQuery.match(
    /\b(\d+(?:[.,]\d+)?)\s*(mil\s+)?(?:km|kilometros?)\b/
  )
  if (mileageMatch) {
    const amount = Number(mileageMatch[1].replace(',', '.'))
    criteria.maxMileage = amount * (mileageMatch[2] ? 1000 : 1)
  }

  criteria.identityTokens =
    normalizedQuery
      .match(/[a-z0-9]+/g)
      ?.filter(
        (token) =>
          token.length >= 2 &&
          !STOP_WORDS.has(token) &&
          !/^\d+$/.test(token)
      ) ?? []

  return criteria
}

export function getBudgetClarificationAmount(
  query: string,
  previousAssistantMessage: string | undefined
): number | undefined {
  if (!previousAssistantMessage) return undefined

  const normalizedPrevious = normalizeQuery(previousAssistantMessage)
  const assistantAskedBudget =
    /\b(presupuesto|monto|tope|invertir|gastar)\b/.test(normalizedPrevious) &&
    /\?/.test(previousAssistantMessage)
  if (!assistantAskedBudget) return undefined

  const normalizedQuery = normalizeQuery(query)
  const explicitBudget = extractVehicleSearchCriteria(query).maxBudget
  if (explicitBudget !== undefined) return explicitBudget

  const bareMillionAmount = normalizedQuery.match(
    /^\s*(?:mi presupuesto es|tengo|unos|un presupuesto de|de|por)?\s*\$?\s*(\d{1,3})(?:\s*(?:millones?|m|palos?))?\s*(?:cop|pesos)?\s*[.!]?\s*$/
  )
  return bareMillionAmount
    ? Number(bareMillionAmount[1]) * 1_000_000
    : undefined
}

export function selectNearestBudgetCandidates<T extends { price: number }>(
  vehicles: T[],
  budget: number,
  limit = 3
): T[] {
  const sorted = [...vehicles].sort((left, right) => left.price - right.price)
  const exact = sorted.filter((vehicle) => vehicle.price === budget)
  if (exact.length > 0) return exact.slice(0, limit)

  const below = sorted.filter((vehicle) => vehicle.price < budget)
  const above = sorted.find((vehicle) => vehicle.price > budget)
  const closestBelow = below.at(-1)

  return [closestBelow, above]
    .filter((vehicle): vehicle is T => vehicle !== undefined)
    .slice(0, limit)
}

export function isVehicleBrowseRequest(query: string): boolean {
  const normalizedQuery = normalizeQuery(query)
  return (
    /\b(busco|estoy buscando|buscar|buscame|busca|encuentrame|encuentra|recomiend|suger|opciones|disponibles|inventario|muestrame|muestreme|muestra|mostrar|enseneme|ensenanos|ensename|quiero ver|quiero que me muestres|me muestras|me interesa|me gusta|tienen|manejan|venden|hay|quiero comprar|necesito comprar|presupuesto|hasta|maximo|millones|parte de pago)\b/.test(
      normalizedQuery
    ) ||
    isBudgetBrowseRequest(
      query,
      extractVehicleSearchCriteria(query).maxBudget !== undefined
    )
  )
}

export function isBudgetBrowseRequest(
  query: string,
  hasBudget: boolean
): boolean {
  if (!hasBudget) return false

  const normalizedQuery = normalizeQuery(query)
  return (
    /\b(busco|buscame|encuentrame|muestrame|muestreme|muestra|mostrar|ensename|enseneme|quiero ver|quiero que me muestres|me muestras|busca|encuentra|ver|interesa|tienen|hay|opciones|disponibles|disponible)\b/.test(
      normalizedQuery
    ) ||
    /\b(?:la|el|uno|una|opcion)\s+(?:de|por|alrededor de|cerca de)\s+\d|\bpor\s+\d/.test(
      normalizedQuery
    )
  )
}

function isFreshSearch(query: string, current: VehicleSearchCriteria): boolean {
  const normalizedQuery = normalizeQuery(query)
  const startsNewSearch =
    /\b(busco|estoy buscando|buscame|encuentrame|quiero comprar|necesito comprar|recomiend|suger|busca opciones|otro vehiculo|otra bicicleta|cambiar de carro)\b/.test(
      normalizedQuery
    )
  const containsNewIdentity = current.identityTokens.length > 0
  const specifiesNewVehicleType = current.bodyType !== undefined
  const explicitlyRefersToEarlierOption =
    /\b(la de|el de|esa|ese|esta|este|la misma|el mismo|la opcion|el vehiculo que|el carro que)\b/.test(
      normalizedQuery
    )

  return (
    (startsNewSearch || containsNewIdentity || specifiesNewVehicleType) &&
    !explicitlyRefersToEarlierOption
  )
}

export function mergeSearchCriteria(
  query: string,
  current: VehicleSearchCriteria,
  previous: VehicleSearchCriteria
): VehicleSearchCriteria {
  if (isFreshSearch(query, current)) return current

  return {
    bodyType: current.bodyType ?? previous.bodyType,
    transmission: current.transmission ?? previous.transmission,
    fuelType: current.fuelType ?? previous.fuelType,
    maxBudget: current.maxBudget ?? previous.maxBudget,
    minYear: current.minYear ?? previous.minYear,
    exactYear: current.exactYear ?? previous.exactYear,
    maxMileage: current.maxMileage ?? previous.maxMileage,
    identityTokens: current.identityTokens.length > 0
      ? current.identityTokens
      : previous.identityTokens,
  }
}
