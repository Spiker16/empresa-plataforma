# Bikefast Electrics

Tienda en línea de **bicicletas eléctricas** en Colombia: catálogo público, asesor virtual con IA y un CRM propio para gestionar inventario, leads y equipo comercial.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript**
- **Prisma** + **PostgreSQL** (extensión `pgvector` para búsqueda semántica)
- **Supabase Storage** (imágenes del catálogo)
- **NextAuth v5** (credenciales + JWT)
- **Tailwind CSS v4**
- **GSAP** + **Lenis** (animaciones y scroll suave)

## Requisitos

- Node.js 20+
- PostgreSQL con la extensión `pgvector` habilitada
- Cuenta de Supabase (almacenamiento de imágenes)
- (Opcional) Ollama para el asesor virtual con IA

## Configuración

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Copia el archivo de variables de entorno y completa los valores:

   ```bash
   cp .env.example .env
   ```

   | Variable | Descripción |
   | --- | --- |
   | `DATABASE_URL` | Conexión a PostgreSQL con pooler (PgBouncer). |
   | `DIRECT_URL` | Conexión directa a PostgreSQL; la usan las migraciones. |
   | `NEXTAUTH_SECRET` | Secreto de NextAuth. Genera con `openssl rand -base64 32`. |
   | `NEXTAUTH_URL` | URL base de la app (`http://localhost:3000` en local). |
   | `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase para las imágenes. |
   | `NEXT_PUBLIC_SITE_URL` | Dominio público sin barra final (canonical, Open Graph, sitemap). |
   | `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp de contacto, formato internacional sin `+`. |
   | `AI_PROVIDER` | Proveedor del asesor virtual; `ollama`. |
   | `OLLAMA_BASE_URL` | URL de Ollama; por defecto `http://127.0.0.1:11434`. |
   | `OLLAMA_MODEL` | Modelo local; por defecto `qwen2.5vl:3b`. |

3. Si cambias de proyecto en Supabase, actualiza el hostname en `next.config.ts` (`images.remotePatterns`).

## Base de datos

```bash
npx prisma migrate deploy   # aplica las migraciones existentes
npx prisma db seed          # crea roles y el usuario SUPER_ADMIN inicial
```

El seed crea el usuario `admin@empresa.com`. **Cambia su contraseña** antes de publicar el sitio.

## Ejecución

```bash
npm run dev     # desarrollo en http://localhost:3000
npm run build   # build de producción
npm run start   # sirve el build de producción
```

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Inicia el build de producción |
| `npm run lint` | Lint con ESLint |
| `postinstall` | Sincroniza las skills de Prisma (`prisma skills sync`) |

## Estructura

```
src/
  app/
    page.tsx              # Landing pública (hero, vortex de bicicletas, catálogo)
    bicicletas/           # Catálogo público
    login/                # Inicio de sesión
    admin/                # CRM protegido (dashboard, catálogo, leads, usuarios, ajustes)
    api/                  # Endpoints (auth, vehículos, leads, IA)
    sitemap.ts            # Sitemap dinámico
    robots.ts             # robots.txt
  components/
    BikeVortex.tsx        # Animación de entrada del hero
    BikefastLoading.tsx   # Pantalla de carga
    admin/                # Componentes del CRM
  lib/
    site.ts               # Configuración central (URL, WhatsApp, SEO)
    prisma.ts             # Cliente Prisma
    auth.ts               # NextAuth
    supabase/client.ts    # Cliente Supabase
  proxy.ts                # Protección de rutas /admin
prisma/
  schema.prisma           # Modelos de datos
  seed.ts                 # Datos iniciales
  migrations/             # Migraciones SQL
```

## Roles

El CRM usa roles para controlar el acceso: `SUPER_ADMIN`, `ADMIN_VEHICULOS`, `ASESOR_COMERCIAL` y `CLIENTE`.

## Asesor virtual con IA

El asesor consulta en tiempo real las bicicletas publicadas y disponibles en PostgreSQL/Prisma, responde dudas de compra y puede recibir una foto del producto. Los mensajes se envían a la instancia de Ollama configurada; no se guarda historial de chat ni se conservan las imágenes. Si el visitante envía el formulario de contacto, se crea un lead en el CRM para seguimiento humano.

Si Ollama no está en ejecución o el modelo no está descargado, el chat lo indica. Para prepararlo:

```powershell
ollama pull qwen2.5vl:3b
```

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5vl:3b
```

Esta versión **no** es una integración de WhatsApp Business: los enlaces abren WhatsApp con el mensaje preparado, pero no reciben respuestas ni disparan el asistente.

## Deploy

Configura las variables de entorno en tu plataforma (Vercel, etc.), ejecuta `npx prisma migrate deploy` y luego `npm run build`.
