import Link from 'next/link'
import Image from 'next/image'
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google'
import { prisma } from '@/lib/prisma'
import { SITE_URL, whatsappLink } from '@/lib/site'
import { bikes as bikeSpecs } from '@/lib/bikes'
import ThemeToggle from '@/components/ThemeToggle'
import SmoothScroll from '@/components/SmoothScroll'
import Motion from '@/components/Motion'
import CookieConsent, { CookieSettingsButton } from '@/components/CookieConsent'
import { serializeJsonLd } from '@/lib/json-ld'
import { ArrowRight, ArrowUpRight, ChevronRight, Zap } from 'lucide-react'
import BikeVortex from '@/components/BikeVortex'

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--f-display',
  display: 'swap',
})
const body = Instrument_Sans({
  subsets: ['latin'],
  variable: '--f-body',
  display: 'swap',
})

export const revalidate = 60

const FALLBACK_BIKE_IMAGE = '/placeholder-bike.svg'

type FeaturedBike = {
  id: string
  title: string
  price: number
  mileage: number
  slug?: string
  image?: string
  description?: string
  topSpeedKmh?: number
  rangeKm?: string
}

const norm = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

// Los nombres largos primero, para que "Galaxy Plus" no se confunda con "Galaxy"
const specIndex = [...bikeSpecs].sort((a, b) => b.name.length - a.name.length)
const findSpec = (title: string) => specIndex.find((spec) => norm(title).includes(norm(spec.name)))

const referenceBikes: FeaturedBike[] = bikeSpecs.map((spec) => ({
  id: spec.slug,
  title: `Bicicleta Eléctrica ${spec.name}`,
  price: spec.price,
  mileage: 0,
  image: spec.image,
  topSpeedKmh: spec.topSpeedKmh,
  rangeKm: spec.rangeKm,
}))

async function getFeaturedBikes(): Promise<FeaturedBike[]> {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: {
        status: 'AVAILABLE',
        published: true,
      },
      select: {
        id: true,
        title: true,
        price: true,
        mileage: true,
        rangeKm: true,
        maxSpeed: true,
        description: true,
        slug: true,
        media: {
          where: { type: 'IMAGE' },
          orderBy: { order: 'asc' },
          take: 1,
          select: { url: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    })
    if (vehicles.length > 0) {
      return vehicles.map((vehicle) => {
        const spec = findSpec(vehicle.title)
        return {
          id: vehicle.id,
          title: vehicle.title,
          price: vehicle.price,
          mileage: vehicle.mileage,
          slug: vehicle.slug,
          image: vehicle.media[0]?.url ?? spec?.image,
          description: vehicle.description?.trim() || undefined,
          topSpeedKmh: vehicle.maxSpeed ?? spec?.topSpeedKmh,
          rangeKm: vehicle.rangeKm ? String(vehicle.rangeKm) : spec?.rangeKm,
        }
      })
    }
    return referenceBikes
  } catch (error) {
    console.warn(
      'Bike Fast: el catálogo no está disponible temporalmente; se mostrarán los modelos de referencia.',
      error instanceof Error ? error.message : error
    )
    return referenceBikes
  }
}

const money = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)

const equipment = [
  'Llantas sello matic',
  'Frenos de disco y tambor',
  'Alarma de aproximación',
  'Cargador inteligente',
]

const marqueeWords = ['Sin tráfico', 'Más libertad', 'Cero emisiones', 'Tu energía']

const css = `
.bike{--hh:72px;--bg:#f5f3ec;--surface:#fff;--ink:#0b0b0b;--mute:#5d5d57;--line:rgba(11,11,11,.14);--y:#ffd51a;--accent:#ffd51a;--accent-dark:#d9ad00;--on-accent:#0b0b0b;--ease:cubic-bezier(.22,1,.36,1);background:var(--bg);color:var(--ink);font-family:var(--f-body),system-ui,sans-serif;overflow-x:clip}
.dark .bike{--bg:#0a0a0a;--surface:#151515;--ink:#f5f3ec;--mute:#a3a39b;--line:rgba(245,243,236,.16)}
.bike .display{font-family:var(--f-display),var(--f-body),sans-serif}
.bike .h1{font-size:clamp(2.75rem,1.2rem + 6vw,6.4rem);line-height:.92;letter-spacing:-.055em;font-weight:700;text-wrap:balance}
.bike .h2{font-size:clamp(2.2rem,1.2rem + 4.2vw,5rem);line-height:.95;letter-spacing:-.05em;font-weight:800;text-wrap:balance}
.bike .lead{font-size:clamp(1rem,.94rem + .35vw,1.2rem);line-height:1.6;max-width:58ch}
.bike .mute{color:var(--mute)}
.bike .btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;border-radius:999px;padding:16px 26px;background:var(--y);color:#0b0b0b;font-size:14px;font-weight:800;letter-spacing:-.01em;transition:filter .2s}
.bike .btn:hover{filter:brightness(1.06)}
.bike .btn-dark{background:#0b0b0b;color:var(--y)}
.bike .btn-ghost{display:inline-flex;align-items:center;gap:7px;font-size:14px;font-weight:700;color:var(--ink);transition:gap .3s var(--ease)}
.bike .btn-ghost:hover{gap:11px}
.bike .card{border:1px solid var(--line);border-radius:28px;background:var(--surface);transition:transform .35s var(--ease)}
.bike .card:hover{transform:translateY(-5px)}
.bike .eyebrow{display:inline-flex;align-items:center;gap:10px;font-size:12px;font-weight:800;letter-spacing:.2em;text-transform:uppercase}
.bike .eyebrow::before{content:"";width:28px;height:2px;background:var(--y)}
.bike .hl{background:var(--y);color:#0b0b0b;padding:0 .14em;border-radius:.12em;-webkit-box-decoration-break:clone;box-decoration-break:clone}

/* Header */
.bike .wordmark{display:flex;flex-direction:column;gap:3px;line-height:1;font-family:var(--f-display),sans-serif;font-weight:800;letter-spacing:-.04em}
.bike .wm-y{align-self:flex-start;background:var(--y);color:#0b0b0b;padding:2px 7px;border-radius:5px;font-size:15px}
.bike .wm-i{display:flex;align-items:center;gap:2px;font-size:13px;letter-spacing:.02em}

/* Hero */
.bike .hero-word{position:absolute;left:-2%;bottom:-.16em;z-index:0;font-family:var(--f-display),sans-serif;font-weight:800;font-size:clamp(10rem,38vw,40rem);line-height:.8;letter-spacing:-.06em;color:transparent;-webkit-text-stroke:1.5px var(--line);pointer-events:none;user-select:none;white-space:nowrap}
.bike .hero-h{font-size:clamp(2.9rem,.8rem + 7.4vw,7.4rem);line-height:.9;letter-spacing:-.06em;font-weight:800;text-transform:uppercase}
.bike .stage{position:relative;width:100%;max-width:680px;margin-inline:auto;aspect-ratio:1/1}
.bike .stage>div{position:absolute;inset:0}
.bike .disc{position:absolute;inset:7%;border-radius:50%;background:var(--y)}
.bike .energy-core{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;border-radius:50%;background:radial-gradient(circle at 42% 35%,rgba(255,255,255,.45),transparent 18%,transparent 48%,rgba(217,173,0,.2) 100%);box-shadow:0 0 70px rgba(255,213,26,.32),inset -22px -24px 48px rgba(217,173,0,.24)}
.bike .energy-core::before{position:absolute;width:140%;height:30%;border:1px solid rgba(11,11,11,.28);border-radius:50%;content:"";transform:rotate(-28deg);animation:energy-orbit 5s linear infinite}
.bike .energy-core::after{position:absolute;inset:12%;border:1px solid rgba(11,11,11,.12);border-radius:50%;content:"";animation:energy-pulse 2.8s ease-in-out infinite}
.bike .energy-bolt{position:relative;z-index:1;width:30%;height:42%;color:#0b0b0b;filter:drop-shadow(0 0 9px rgba(255,255,255,.65));animation:energy-strike 2.4s ease-in-out infinite}
.bike .energy-bolt path{fill:currentColor}
.bike .energy-spark{position:absolute;z-index:2;width:5px;height:5px;border-radius:50%;background:#fff8c7;box-shadow:0 0 12px 4px var(--y);animation:energy-spark 1.8s ease-in-out infinite}
.bike .energy-spark--one{top:22%;left:24%}.bike .energy-spark--two{right:20%;bottom:28%;animation-delay:.7s}
@keyframes energy-orbit{to{transform:rotate(332deg)}}@keyframes energy-pulse{0%,100%{transform:scale(.94);opacity:.45}50%{transform:scale(1.04);opacity:1}}@keyframes energy-strike{0%,100%{transform:translateY(7px) scale(.9);opacity:.72}20%,62%{transform:translateY(0) scale(1);opacity:1}25%{transform:translate(3px,-2px) scale(1.04)}29%{transform:translate(-2px,1px) scale(.98)}}@keyframes energy-spark{0%,100%{transform:scale(.2);opacity:0}45%{transform:scale(1);opacity:1}}
.bike .stage-img{position:relative;width:100%;height:100%;filter:drop-shadow(0 40px 35px rgba(0,0,0,.35))}
/* La Rayo va sobre el disco amarillo: se recorta el fondo del placeholder para que se funda con la esfera */
.bike .stage-bike{mix-blend-mode:multiply;filter:contrast(1.06) saturate(1.05)}
.dark .bike .stage-bike{mix-blend-mode:normal;filter:none}
.bike .badge{position:absolute;right:2%;top:4%;width:clamp(86px,11vw,128px);color:var(--ink);animation:spin 18s linear infinite}
.bike .badge text{font-size:10.5px;font-weight:800;letter-spacing:.14em;fill:currentColor}
.bike .stats{display:grid;grid-template-columns:repeat(2,1fr);gap:28px 20px;max-width:1500px;margin:0 auto;padding:28px 24px 44px;border-top:1px solid var(--line);position:relative;z-index:1}
@media(min-width:900px){.bike .stats{grid-template-columns:repeat(4,1fr)}}
.bike .stat-n{font-family:var(--f-display),sans-serif;font-weight:800;font-size:clamp(2.6rem,5vw,4.6rem);line-height:.9;letter-spacing:-.05em}
.bike .stat-n small{font-size:.32em;letter-spacing:0;margin-left:6px;font-weight:700}
.bike .stat-l{margin-top:10px;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--mute)}

/* Marquee */
.bike .marquee{overflow:hidden;white-space:nowrap;border-block:1px solid var(--line)}
.bike .marquee-track{display:inline-flex;min-width:max-content}
.bike:not(.js-motion) .marquee-track{animation:marquee 34s linear infinite}
.bike .marquee-item{display:inline-flex;align-items:center;gap:34px;padding:22px 34px;font-family:var(--f-display),sans-serif;font-size:clamp(2.2rem,6vw,6rem);font-weight:800;letter-spacing:-.05em;text-transform:uppercase;line-height:1}
.bike .marquee-item:nth-child(even){color:transparent;-webkit-text-stroke:1.5px currentColor;color:transparent}
.bike .marquee-item::after{content:"";width:.22em;height:.22em;border-radius:50%;background:var(--y);flex:none}

/* Catálogo */
.bike .hs-head{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:24px;max-width:1500px;margin:0 auto;padding:64px 24px 32px}
.bike .hs-track{display:flex;gap:20px;overflow-x:auto;scroll-snap-type:x mandatory;padding:0 24px 28px;scrollbar-width:none}
.bike .hs-track::-webkit-scrollbar{display:none}
.bike .bcard{flex:0 0 auto;width:min(82vw,420px);scroll-snap-align:start;display:flex;flex-direction:column;border-radius:36px;padding:22px;background:var(--surface);color:var(--ink);border:1px solid var(--line)}
.bike .bcard:nth-child(3n+1){background:var(--y);color:#0b0b0b;border-color:transparent}
.bike .bcard-top{display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
.bike .bcard-tag{border:1.5px solid currentColor;border-radius:999px;padding:4px 12px}
.bike .bcard-stage{position:relative;flex:1;min-height:200px}
.bike .bcard-img{object-fit:contain;transition:transform .9s var(--ease);filter:drop-shadow(0 22px 20px rgba(0,0,0,.28))}
.bike .bcard:hover .bcard-img{transform:scale(1.07) rotate(-2deg)}
.bike .bcard-ghost{position:absolute;inset:0;display:grid;place-items:center;font-family:var(--f-display),sans-serif;font-size:clamp(8rem,14vw,12rem);font-weight:800;color:transparent;-webkit-text-stroke:1.5px currentColor;opacity:.3}
.bike .bcard-name{font-size:clamp(2rem,3vw,3rem);font-weight:800;letter-spacing:-.05em;line-height:.95;text-transform:uppercase}
.bike .bcard-price{margin-top:8px;font-size:1.25rem;font-weight:800}
.bike .bcard-desc{margin-top:10px;font-size:13.5px;line-height:1.5;opacity:.78;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.bike .bcard-specs{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px;padding-top:14px;border-top:1px solid color-mix(in srgb,currentColor 25%,transparent)}
.bike .bcard-specs dt{font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;opacity:.6}
.bike .bcard-specs dd{margin-top:3px;font-size:14px;font-weight:800}
.bike .bcard-end{justify-content:space-between;background:#0b0b0b!important;color:var(--y)!important}
.dark .bike .bcard-end{background:var(--surface)!important;border-color:var(--line)}
.bike .bcard-end .bcard-name{font-size:clamp(2.4rem,4vw,3.8rem)}

/* Vórtice 3D del hero: las tarjetas giran en espiral y aterrizan sobre la bici Rayo */
.bike .vortex{position:absolute;inset:0;z-index:6;pointer-events:none;overflow:visible;perspective:900px;perspective-origin:50% 50%;transform-style:preserve-3d}
.bike .vortex-item{position:absolute;left:0;top:0;transform-style:preserve-3d;will-change:transform,opacity;backface-visibility:hidden}
.bike .vcard{display:flex;flex-direction:column;width:100%;height:100%;border-radius:22px;padding:10px 12px 12px;background:var(--surface);color:var(--ink);border:1px solid var(--line);box-shadow:0 26px 50px -18px rgba(0,0,0,.55);overflow:hidden}
.bike .vcard--alt{background:var(--y);color:#0b0b0b;border-color:transparent}
.bike .vcard-top{display:flex;align-items:center;justify-content:space-between;font-size:9px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;opacity:.85}
.bike .vcard-tag{border:1.2px solid currentColor;border-radius:999px;padding:2px 8px;font-size:8px}
.bike .vcard-stage{position:relative;flex:1;min-height:0;margin-top:6px}
.bike .vcard-img{object-fit:contain;filter:drop-shadow(0 12px 12px rgba(0,0,0,.3))}
.bike .vcard-name{margin-top:6px;font-size:clamp(.72rem,1.1vw,.95rem);font-weight:800;letter-spacing:-.03em;line-height:1;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@media (prefers-reduced-motion:reduce){.bike .vortex{display:none}}

/* Catálogo en escritorio: las tarjetas se adaptan a la altura de la ventana para que no se corten */
@media(min-width:1024px){
  .bike .hs{height:calc(100svh - var(--hh));overflow:hidden;display:flex;flex-direction:column;padding-block:clamp(14px,3svh,40px)}
  .bike .hs-head{flex:none;width:100%;padding-top:0;padding-bottom:clamp(12px,2.6svh,28px)}
  .bike .hs-head .h2{font-size:clamp(2rem,7svh,4.6rem)}
  .bike .hs-track{flex:1 1 0;min-height:0;overflow:visible;scroll-snap-type:none;width:max-content;padding:0 max(24px,calc((100vw - 1500px)/2 + 24px))}
  .bike .bcard{width:clamp(340px,28vw,470px);min-height:0;padding:clamp(14px,2.6svh,22px);border-radius:clamp(24px,4svh,36px)}
  .bike .bcard-stage{flex:1 1 0;min-height:0}
  .bike .bcard-name{font-size:clamp(1.5rem,4.6svh,2.8rem)}
  .bike .bcard-price{margin-top:4px;font-size:clamp(1rem,2.6svh,1.25rem)}
  .bike .bcard-desc{margin-top:6px;font-size:clamp(11.5px,1.7svh,13.5px);-webkit-line-clamp:2}
  .bike .bcard-specs{margin-top:clamp(8px,1.6svh,16px);padding-top:clamp(8px,1.4svh,14px)}
  .bike .bcard-end .bcard-name{font-size:clamp(1.7rem,min(4vw,6svh),3.8rem)}
}

/* Mensaje y equipamiento */
.bike .statement{font-size:clamp(2rem,1rem + 4.6vw,5.4rem);line-height:1;letter-spacing:-.05em;font-weight:800;max-width:20ch}
.bike .feat-n{margin-top:18px;font-family:var(--f-display),sans-serif;font-weight:800;font-size:clamp(2.4rem,4vw,3.6rem);letter-spacing:-.05em;line-height:1}
.bike .feat-t{margin-top:10px;font-size:1.35rem;font-weight:800;letter-spacing:-.03em;line-height:1.1}
.bike .feat-tag{display:inline-block;margin-top:12px;border:1px solid var(--line);border-radius:999px;padding:4px 12px;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--mute)}
.bike .line{height:1px;background:var(--ink);opacity:.5}

/* CTA y footer */
.bike .cta{position:relative;overflow:hidden;border-radius:40px;background:var(--y);color:#0b0b0b;padding:clamp(32px,6vw,88px) clamp(24px,5vw,80px) 0}
.bike .cta .eyebrow::before{background:#0b0b0b}
.bike .cta-h{font-size:clamp(2.8rem,1rem + 8vw,9rem);line-height:.88;letter-spacing:-.06em;font-weight:800;text-transform:uppercase;max-width:14ch}
.bike .cta .marquee{margin:clamp(32px,5vw,64px) calc(clamp(24px,5vw,80px) * -1) 0;border-color:rgba(11,11,11,.25)}
.bike .cta .marquee-item{font-size:clamp(1.6rem,4vw,3.6rem)}
.bike .foot-word{font-family:var(--f-display),sans-serif;font-weight:800;font-size:clamp(5rem,21vw,26rem);line-height:.78;letter-spacing:-.07em;text-align:center;color:var(--y);margin-top:56px;white-space:nowrap;user-select:none}

/* Cursor */
.bike .bf-cursor{position:fixed;left:0;top:0;z-index:90;width:104px;height:104px;border-radius:50%;background:var(--y);color:#0b0b0b;border:2px solid #0b0b0b;display:grid;place-items:center;pointer-events:none;font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;opacity:0;will-change:transform}
.bike.has-cursor,.bike.has-cursor a,.bike.has-cursor button{cursor:none}
.bike.has-cursor input,.bike.has-cursor textarea,.bike.has-cursor select{cursor:auto}
@media(hover:none),(pointer:coarse){.bike .bf-cursor{display:none}}

/* Estados iniciales: solo si el JS de animación está activo */
.bike.js-motion [data-split],.bike.js-motion [data-words]{visibility:hidden}
.bike.js-motion [data-reveal],.bike.js-motion [data-header],.bike.js-motion [data-hero-fade],.bike.js-motion [data-hero-disc],.bike.js-motion [data-hero-bike]{opacity:0}

@keyframes spin{to{transform:rotate(360deg)}}
@keyframes marquee{to{transform:translateX(-50%)}}
@media (prefers-reduced-motion:reduce){.bike .badge,.bike .marquee-track,.bike .energy-core::before,.bike .energy-core::after,.bike .energy-bolt,.bike .energy-spark{animation:none}.bike .card:hover,.bike .bcard:hover .bcard-img{transform:none}}
`

function BikeCard({ bike, index }: { bike: FeaturedBike; index: number }) {
  const href = bike.slug
    ? `/bicicletas/${bike.slug}`
    : whatsappLink(`Hola Bike Fast, quiero información sobre ${bike.title}`)
  const shortName = bike.title.replace(/^bicicleta el[eé]ctrica\s*/i, '')
  return (
    <Link href={href} data-cursor="Ver" className="bcard">
      <div className="bcard-top">
        <span>{String(index + 1).padStart(2, '0')}</span>
        <span className="bcard-tag">Disponible</span>
      </div>
      <div className="bcard-stage">
        {bike.image ? (
          <Image
            src={bike.image}
            alt={`${bike.title}, bicicleta eléctrica`}
            fill
            sizes="(max-width: 1024px) 82vw, 30vw"
            className="bcard-img"
          />
        ) : (
          <span className="bcard-ghost" aria-hidden>
            {shortName.charAt(0)}
          </span>
        )}
      </div>
      <div>
        <h3 className="display bcard-name">{shortName}</h3>
        <p className="bcard-price">{money(bike.price)}</p>
        {bike.description ? <p className="bcard-desc">{bike.description}</p> : null}
        <dl className="bcard-specs">
          {bike.topSpeedKmh || bike.rangeKm ? (
            <>
              <div>
                <dt>Velocidad máx.</dt>
                <dd>{bike.topSpeedKmh ? `${bike.topSpeedKmh} km/h` : 'Consúltala'}</dd>
              </div>
              <div>
                <dt>Rango</dt>
                <dd>{bike.rangeKm ? `${bike.rangeKm} km` : 'Consúltalo'}</dd>
              </div>
            </>
          ) : (
            <>
              <div>
                <dt>Frenos</dt>
                <dd>Disco y tambor</dd>
              </div>
              <div>
                <dt>Ficha técnica</dt>
                <dd>Por WhatsApp</dd>
              </div>
            </>
          )}
        </dl>
      </div>
    </Link>
  )
}

export default async function Home() {
  const bikes = await getFeaturedBikes()
  // La bici del hero es siempre la Rayo (no depende del CRM)
  const heroBike = bikeSpecs.find((spec) => spec.slug === 'rayo')
  const heroImage = heroBike?.image ?? FALLBACK_BIKE_IMAGE
  // El vórtice se alimenta del catálogo real (CRM); si aún no hay fotos, usa el placeholder
  const vortexBikes = bikes
    .map((bike, index) => ({
      slug: bike.slug ?? bike.id ?? `bike-${index}`,
      title: bike.title.replace(/^bicicleta el[eé]ctrica\s*/i, ''),
      image: bike.image ?? FALLBACK_BIKE_IMAGE,
    }))
    .slice(0, 8)

  const bikesJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Bicicletas eléctricas Bike Fast',
    itemListElement: bikes.map((bike, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: bike.title,
        url: bike.slug ? `${SITE_URL}/bicicletas/${bike.slug}` : SITE_URL,
        image: bike.image,
        brand: { '@type': 'Brand', name: 'Bike Fast Electric' },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'COP',
          price: bike.price,
          availability: 'https://schema.org/InStock',
        },
      },
    })),
  }

  return (
    <div
      className={`${display.variable} ${body.variable} bike min-h-screen`}
      suppressHydrationWarning
    >
      {/* Evita el parpadeo mientras Motion prepara la entrada; el respaldo evita contenido oculto. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "(function(){var r=document.currentScript&&document.currentScript.parentElement;if(!r||matchMedia('(prefers-reduced-motion: reduce)').matches)return;r.classList.add('js-motion');setTimeout(function(){if(!window.__bfMotion)r.classList.remove('js-motion')},1800)})()",
        }}
      />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(bikesJsonLd) }} />

      <SmoothScroll />
      <Motion />

      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:rounded-full focus:bg-[#ffd51a] focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-black">
        Saltar al contenido
      </a>

      <header
        data-header
        className="sticky top-0 z-50 border-b backdrop-blur-xl"
        style={{ height: 'var(--hh)', borderColor: 'var(--line)', background: 'color-mix(in srgb,var(--bg) 82%,transparent)' }}
      >
        <div className="mx-auto flex h-full max-w-[1500px] items-center justify-between gap-5 px-6">
          <Link href="/" className="wordmark" aria-label="Bike Fast Electric, inicio">
            <span className="wm-y">BIKE FAST</span>
            <span className="wm-i">
              ELECTRIC <Zap className="h-3.5 w-3.5" style={{ color: 'var(--ink)' }} aria-hidden />
            </span>
          </Link>
          <nav aria-label="Principal" className="hidden items-center gap-8 md:flex">
            <Link href="#bicicletas" className="btn-ghost">Bicicletas</Link>
            <Link href="#por-que" className="btn-ghost">Por qué Bike Fast</Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href={whatsappLink('Hola Bike Fast, quiero conocer las bicicletas eléctricas disponibles')}
              className="btn hidden !px-5 !py-3 sm:inline-flex"
              data-magnetic="0.3"
              data-cursor="Chatear"
            >
              Hablar por WhatsApp
            </Link>
          </div>
        </div>
      </header>

      <main id="contenido">
        {/* HERO */}
        <section data-hero className="relative isolate overflow-hidden">
          <div className="hero-word" data-drift="-16" aria-hidden>FAST</div>

          <div
            className="relative z-10 mx-auto grid max-w-[1500px] items-center gap-6 px-6 pt-10 lg:grid-cols-12 lg:pt-4"
            style={{ minHeight: 'calc(100svh - var(--hh) - 130px)' }}
          >
            <div className="lg:col-span-7">
              <p className="eyebrow" data-hero-fade>Muévete diferente</p>
              <h1 className="display hero-h mt-6" data-split="hero">
                Tu ciudad. Tu ritmo. <span className="hl">Tu bici eléctrica.</span>
              </h1>
              <p className="lead mute mt-8" data-hero-fade>
                Descubre una forma más rápida, limpia y divertida de moverte. En Bike Fast Electric encuentras bicicletas eléctricas listas para acompañarte todos los días.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5" data-hero-fade>
                <Link href="#bicicletas" className="btn" data-magnetic="0.35" data-cursor="Ir">
                  Ver bicicletas <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="#bicicletas" className="btn-ghost">
                  Encuentra la tuya <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="stage">
                <div data-depth="0.5">
                  <div className="disc" data-hero-disc>
                    <div className="energy-core" aria-hidden="true">
                      <span className="energy-spark energy-spark--one" />
                      <span className="energy-spark energy-spark--two" />
                      <svg className="energy-bolt" viewBox="0 0 100 140">
                        <path d="M61 3 18 78h28l-8 59 44-82H54z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div data-depth="1.3">
                  <div className="h-full w-full" data-hero-bike>
                    <div className="stage-img" data-float>
                      <Image
                        src={heroImage}
                        alt="Bicicleta eléctrica Rayo de Bike Fast Electric"
                        fill
                        priority
                        sizes="(max-width: 1024px) 90vw, 40vw"
                        className="stage-bike"
                        style={{ objectFit: 'contain' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Vórtice de bicicletas: entra después de la pantalla de carga */}
                <BikeVortex bikes={vortexBikes} delay={2600} />

                <svg className="badge" viewBox="0 0 120 120" aria-hidden="true">
                  <defs>
                    <path id="bf-circle" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
                  </defs>
                  <text>
                    <textPath href="#bf-circle" textLength="270" lengthAdjust="spacing">
                      ELÉCTRICA · RÁPIDA · ELÉCTRICA · RÁPIDA ·
                    </textPath>
                  </text>
                  <circle cx="60" cy="60" r="6" fill="currentColor" />
                </svg>
              </div>
            </div>
          </div>

          <div className="stats" data-hero-fade>
            <div>
              <p className="stat-n"><span data-count="49" data-count-wait>49</span><small>km/h</small></p>
              <p className="stat-l">Velocidad máxima · Rayo</p>
            </div>
            <div>
              <p className="stat-n">Hasta <span data-count="60" data-count-wait>60</span><small>km</small></p>
              <p className="stat-l">Rango máximo</p>
            </div>
            <div>
              <p className="stat-n"><span data-count="9" data-count-wait>9</span></p>
              <p className="stat-l">Modelos disponibles</p>
            </div>
            <div>
              <p className="stat-n"><span data-count="2" data-count-wait>2</span></p>
              <p className="stat-l">Tiendas · Madrid y Facatativá</p>
            </div>
          </div>
        </section>

        {/* MARQUEE */}
        <div className="marquee" data-marquee aria-label="Bike Fast Electric: movilidad eléctrica">
          <div className="marquee-track" data-marquee-track aria-hidden="true">
            {[...marqueeWords, ...marqueeWords, ...marqueeWords, ...marqueeWords].map((item, index) => (
              <span key={`${item}-${index}`} className="marquee-item">{item}</span>
            ))}
          </div>
        </div>

        {/* CATÁLOGO */}
        <section id="bicicletas" aria-labelledby="t-bicicletas" className="hs" data-hscroll>
          <div className="hs-head">
            <div>
              <p className="eyebrow" data-reveal>Catálogo</p>
              <h2 id="t-bicicletas" className="display h2 mt-4" data-split>
                Elige cómo quieres moverte.
              </h2>
            </div>
            <p className="lead mute" data-reveal style={{ maxWidth: '38ch' }}>
              Modelos para ciudad, trabajo y aventura, con precios claros y asesoría cercana.
            </p>
          </div>
          <div className="hs-track" data-hscroll-track>
            {bikes.map((bike, index) => (
              <BikeCard key={bike.id} bike={bike} index={index} />
            ))}
            <Link
              href={whatsappLink('Hola Bike Fast, quiero conocer todo el catálogo de bicicletas eléctricas')}
              data-cursor="Escribir"
              className="bcard bcard-end"
            >
              <span className="bcard-top"><span>Catálogo</span></span>
              <p className="display bcard-name">
                ¿No ves la tuya? Cotiza el catálogo completo
              </p>
              <ArrowUpRight className="h-12 w-12" />
            </Link>
          </div>
        </section>

        {/* POR QUÉ */}
        <section id="por-que" className="relative py-28 lg:py-44">
          <div className="mx-auto max-w-[1500px] px-6">
            <p className="eyebrow" data-reveal>Bike Fast promise</p>
            <p className="display statement mt-8" data-words>
              Más que una bici, una mejor forma de vivir la ciudad.
            </p>

            <p className="lead mute mt-20" data-reveal>
              Esto incluyen modelos como SOL y Rayo:
            </p>
            <div className="mt-8 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
              {equipment.map((item, index) => (
                <div key={item}>
                  <div className="line" data-line />
                  <p className="feat-n" data-reveal>0{index + 1}</p>
                  <h3 className="display feat-t" data-reveal data-delay="0.08">{item}</h3>
                  <span className="feat-tag" data-reveal data-delay="0.14">SOL · Rayo</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 pb-4 sm:px-6">
          <div className="cta mx-auto max-w-[1500px]">
            <p className="eyebrow" data-reveal>Tu próxima ruta empieza aquí</p>
            <h2 className="display cta-h mt-6" data-split>¿Listo para pedalear distinto?</h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed" data-reveal>
              Cuéntanos cómo te mueves y te recomendamos una bicicleta eléctrica que se adapte a tu vida.
            </p>
            <Link
              href={whatsappLink('Hola Bike Fast, quiero asesoría para elegir una bicicleta eléctrica')}
              className="btn btn-dark mt-10"
              data-magnetic="0.4"
              data-cursor="Escribir"
            >
              Hablar con Bike Fast <ArrowUpRight className="h-4 w-4" />
            </Link>
            <div className="marquee" data-marquee data-marquee-dir="-1" aria-hidden="true">
              <div className="marquee-track" data-marquee-track>
                {[...marqueeWords, ...marqueeWords, ...marqueeWords, ...marqueeWords].map((item, index) => (
                  <span key={`cta-${item}-${index}`} className="marquee-item">{item}</span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="pt-16" style={{ borderTop: '1px solid var(--line)' }}>
        <div className="mx-auto grid max-w-[1500px] gap-10 px-6 sm:grid-cols-3">
          <div>
            <Link href="/" className="wordmark" aria-label="Bike Fast Electric">
              <span className="wm-y">BIKE FAST</span>
              <span className="wm-i">ELECTRIC</span>
            </Link>
            <p className="mute mt-4 max-w-sm text-sm leading-relaxed">
              Bicicletas eléctricas para moverte con libertad, energía y propósito.
            </p>
          </div>
          <nav aria-label="Explorar">
            <p className="font-bold">Explorar</p>
            <ul className="mute mt-4 space-y-3 text-sm">
              <li><Link href="#bicicletas" className="hover:text-[var(--ink)]">Bicicletas</Link></li>
              <li><Link href="#por-que" className="hover:text-[var(--ink)]">Por qué Bike Fast</Link></li>
              <li><CookieSettingsButton className="hover:text-[var(--ink)]">Configurar cookies</CookieSettingsButton></li>
            </ul>
          </nav>
          <div>
            <p className="font-bold">Contacto</p>
            <ul className="mute mt-4 space-y-3 text-sm">
              <li><a href={whatsappLink('Hola Bike Fast, quiero información')} className="hover:text-[var(--ink)]">WhatsApp: 304 446 4028</a></li>
              <li>Madrid: Calle 7 #2-65</li>
              <li>Facatativá: Carrera 5 #3-36</li>
              <li className="flex gap-4 pt-2">
                <a href="https://www.instagram.com/bikefastelectric/" target="_blank" rel="noreferrer" className="hover:text-[var(--ink)]">Instagram</a>
                <a href="https://www.facebook.com/profile.php?id=61558779477187" target="_blank" rel="noreferrer" className="hover:text-[var(--ink)]">Facebook</a>
                <a href="https://www.tiktok.com/@bike.fast.electri" target="_blank" rel="noreferrer" className="hover:text-[var(--ink)]">TikTok</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="overflow-hidden">
          <div className="foot-word" data-parallax="5" aria-hidden>BIKE FAST</div>
        </div>
        <p className="mute mx-auto max-w-[1500px] px-6 py-6 text-xs">
          © {new Date().getFullYear()} Bike Fast Electric. Todos los derechos reservados.
        </p>
      </footer>

      <CookieConsent />
    </div>
  )
}