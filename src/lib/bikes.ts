export type BikeSpec = {
  slug: string
  name: string
  price: number
  topSpeedKmh?: number
  rangeKm?: string
  image?: string
}

export const bikes: BikeSpec[] = [
  { slug: 'sol', name: 'SOL', price: 2500000, topSpeedKmh: 25, rangeKm: '40-60' },
  { slug: 'rayo', name: 'Rayo', price: 3450000, topSpeedKmh: 35, rangeKm: '50-70' },
  { slug: 'aguila', name: 'Águila', price: 4000000, topSpeedKmh: 35, rangeKm: '60-80' },
  { slug: 'galaxy', name: 'Galaxy', price: 2900000, topSpeedKmh: 30, rangeKm: '45-65' },
  { slug: 'primavera', name: 'Primavera', price: 2700000, topSpeedKmh: 25, rangeKm: '40-60' },
  { slug: 'urban', name: 'Urban', price: 3100000, topSpeedKmh: 30, rangeKm: '45-65' },
  { slug: 'vmp-s5', name: 'VMP S5', price: 2200000, topSpeedKmh: 25, rangeKm: '35-50' },
  { slug: 'rayopro', name: 'Rayopro', price: 3400000, topSpeedKmh: 35, rangeKm: '50-70' },
  { slug: 'galaxy-plus', name: 'Galaxy Plus', price: 3800000, topSpeedKmh: 35, rangeKm: '60-80' },
]
