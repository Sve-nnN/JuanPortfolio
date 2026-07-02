# 03 — Guía de Instalación (lo que recibe el comprador)

> Esta es la guía paso a paso que se incluye en el `README.md` del repositorio. Debe permitir a cualquier developer tener el sitio corriendo en 30 minutos o menos.

---

## Requisitos Previos

- **Node.js** ≥ 20.x
- **pnpm** (recomendado) o npm
- **Docker Desktop** (para MongoDB local)
- **Cuenta de Vercel** (para deploy)
- **Cuenta de MongoDB Atlas** (para producción)
- **Cuenta de Resend** (para emails, opcional)

---

## Paso 1: Clonar e Instalar (3 minutos)

```bash
# Clonar el repositorio
git clone https://github.com/juantech/juan-tech-starter.git mi-sitio
cd mi-sitio

# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp .env.example .env
```

---

## Paso 2: Configurar Variables de Entorno (5 minutos)

Editar `.env`:

```env
# Base de datos
MONGODB_URI=mongodb://localhost:27017/mi-sitio

# Payload CMS
PAYLOAD_SECRET=genera-un-secreto-largo-aqui
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000

# S3 / Cloud Storage (opcional para media)
S3_ENDPOINT=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET=

# Resend (emails, opcional)
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Google Search Console (opcional, para analytics)
GSC_CLIENT_EMAIL=
GSC_PRIVATE_KEY=
```

---

## Paso 3: Levantar MongoDB con Docker (2 minutos)

```bash
docker-compose up -d mongodb
```

Esto levanta MongoDB 7 en `localhost:27017`.

---

## Paso 4: Inicializar Payload CMS (5 minutos)

```bash
# Generar types de TypeScript
pnpm generate:types

# Crear usuario admin
pnpm payload create:user
```

Seguir el prompt interactivo:
- Email: tu@email.com
- Password: (elegir contraseña segura)
- Role: admin

---

## Paso 5: Sembrar Datos de Ejemplo (opcional, 1 minuto)

```bash
pnpm seed
```

Esto crea:
- 1 autor
- 2 categorías (Tech SEO, Development)
- 3 posts de ejemplo con contenido real
- 2 páginas (Home, About)

---

## Paso 6: Iniciar en Desarrollo (1 minuto)

```bash
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000) — el sitio está corriendo.

Panel de administración: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## Paso 7: Personalizar (10-30 minutos)

### Cambiar nombre del sitio
Editar `src/utilities/constants.ts`:
```typescript
export const SITE_NAME = 'Mi Sitio'
export const SITE_URL = 'https://misitio.com'
```

### Cambiar colores
Editar `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: { /* tus colores */ },
      accent: { /* tus colores */ },
    }
  }
}
```

### Cambiar fuentes
Editar `src/app/(frontend)/layout.tsx`:
```typescript
import { Inter, Merriweather } from 'next/font/google'
// Cambiar por tus fuentes
```

### Añadir tu contenido
1. Ir al admin panel (`/admin`)
2. Crear categorías
3. Crear posts
4. Personalizar homepage

---

## Paso 8: Deploy a Producción (15 minutos)

Ver guía completa: [`docs/DEPLOY.md`](./04-guia-deploy.md)

Resumen rápido:
```bash
# 1. Push a GitHub
git push origin main

# 2. Conectar repo en Vercel
# vercel.com/import

# 3. Configurar variables de entorno en Vercel

# 4. Deploy automático en cada push
```

---

## Solución de Problemas Comunes

### "MongoDB connection refused"
→ Asegúrate de que Docker está corriendo: `docker ps | grep mongodb`

### "Module not found: @payloadcms/..."
→ Ejecuta `pnpm install` y luego `pnpm generate:types`

### "Invalid environment variables"
→ Revisa que `.env` existe y tiene todas las variables requeridas (ver `.env.example`)

### "Build failed on Vercel"
→ Verifica que las variables de entorno en Vercel coinciden con `.env.example`

---

## Próximos Pasos

1. **Personalizar diseño** — Colores, fuentes, layout → `docs/CUSTOMIZATION.md`
2. **Configurar dominio** — Añadir dominio personalizado en Vercel
3. **Conectar Google Search Console** — Verificar propiedad y enviar sitemap
4. **Migrar contenido existente** — `docs/MIGRATION.md`
