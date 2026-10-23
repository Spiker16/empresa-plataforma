import assert from 'node:assert/strict'
import test from 'node:test'
import {
  extractVehicleSearchCriteria,
  getBudgetClarificationAmount,
  isBudgetBrowseRequest,
  isVehicleBrowseRequest,
  mergeSearchCriteria,
  selectNearestBudgetCandidates,
  type VehicleSearchCriteria,
} from './vehicle-assistant-intents'

test('recognizes price browsing across common Spanish phrasings', () => {
  const phrasings = [
    'muéstrame la de 80 millones',
    'enséñame una opción por 80 millones',
    'búscame algo alrededor de 80 millones',
    'quiero ver bicicletas eléctricas de 80 millones',
    '¿Qué opciones hay por 80 millones?',
    'muéstrame uno de 80m',
    'me interesa la de 80 palos',
    'muéstrame la de 80.000.000',
    'enséñame la de 80',
    '¿Qué tienes por 80?',
  ]

  for (const phrasing of phrasings) {
    assert.equal(isVehicleBrowseRequest(phrasing), true, phrasing)
    assert.equal(isBudgetBrowseRequest(phrasing, true), true, phrasing)
    assert.equal(extractVehicleSearchCriteria(phrasing).maxBudget, 80_000_000)
  }
})

test('recognizes vehicle requests even when they use different verbs', () => {
  for (const phrasing of [
    '¿qué bicicletas tienen?',
    'encuéntrame un sedán',
    '¿me muestras las bicicletas disponibles?',
    'necesito comprar un carro',
    'me interesa ver una SUV',
  ]) {
    assert.equal(isVehicleBrowseRequest(phrasing), true, phrasing)
  }
})

test('a newly stated price replaces the old price while retaining the chosen vehicle type', () => {
  const previous: VehicleSearchCriteria = {
    bodyType: 'CAMIONETA',
    maxBudget: 70_000_000,
    identityTokens: [],
  }
  const current: VehicleSearchCriteria = {
    maxBudget: 80_000_000,
    identityTokens: [],
  }

  const merged = mergeSearchCriteria(
    'muéstrame la de 80 millones',
    current,
    previous
  )
  assert.equal(merged.bodyType, 'CAMIONETA')
  assert.equal(merged.maxBudget, 80_000_000)
  assert.deepEqual(merged.identityTokens, [])
})

test('a fresh make/model search does not retain stale criteria', () => {
  const previous: VehicleSearchCriteria = {
    bodyType: 'CAMIONETA',
    maxBudget: 70_000_000,
    identityTokens: ['toyota'],
  }
  const current: VehicleSearchCriteria = {
    bodyType: 'MOTO',
    identityTokens: ['honda'],
  }

  assert.deepEqual(
    mergeSearchCriteria('busco una bicicleta Honda', current, previous),
    current
  )
})

test('a reply to a budget clarification is understood even without saying "millions"', () => {
  const assistantAskedBudget =
    'Claro. ¿Qué presupuesto máximo tienes en mente?'

  assert.equal(
    getBudgetClarificationAmount('60 millones', assistantAskedBudget),
    60_000_000
  )
  assert.equal(
    getBudgetClarificationAmount('unos 60', assistantAskedBudget),
    60_000_000
  )
  assert.equal(
    getBudgetClarificationAmount('por 80 palos', assistantAskedBudget),
    80_000_000
  )
  assert.equal(
    getBudgetClarificationAmount('80', assistantAskedBudget),
    80_000_000
  )
  assert.equal(getBudgetClarificationAmount('60 millones', undefined), undefined)
  assert.equal(
    getBudgetClarificationAmount(
      '60 millones',
      '¿Qué tipo de bicicleta eléctrica estás buscando?'
    ),
    undefined
  )
})

test('budget results are exactly priced or the nearest below and above, never farther above', () => {
  const prices = [
    { title: 'A', price: 120_000_000 },
    { title: 'B', price: 80_000_000 },
    { title: 'C', price: 50_000_000 },
    { title: 'D', price: 59_000_000 },
  ]

  assert.deepEqual(
    selectNearestBudgetCandidates(prices, 60_000_000).map((vehicle) => vehicle.price),
    [59_000_000, 80_000_000]
  )
  assert.deepEqual(
    selectNearestBudgetCandidates(
      prices.filter((vehicle) => vehicle.price > 60_000_000),
      60_000_000
    ).map((vehicle) => vehicle.price),
    [80_000_000]
  )
  assert.deepEqual(
    selectNearestBudgetCandidates(prices, 80_000_000).map((vehicle) => vehicle.price),
    [80_000_000]
  )
})

test('budget refinements keep the previous vehicle type but replace the previous limit', () => {
  const previous: VehicleSearchCriteria = {
    bodyType: 'CAMIONETA',
    maxBudget: 70_000_000,
    identityTokens: [],
  }
  const clarifiedAmount = getBudgetClarificationAmount(
    '60',
    '¿Qué presupuesto máximo tienes en mente?'
  )
  const updated: VehicleSearchCriteria = {
    ...extractVehicleSearchCriteria('60 millones'),
    maxBudget: clarifiedAmount,
  }

  const merged = mergeSearchCriteria(
    '60 millones',
    updated,
    previous
  )
  assert.equal(merged.bodyType, 'CAMIONETA')
  assert.equal(merged.maxBudget, 60_000_000)
})
