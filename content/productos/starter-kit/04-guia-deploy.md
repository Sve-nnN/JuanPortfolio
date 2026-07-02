# 04 — Guía de Deploy Completa

> Esta guía se incluye como `docs/DEPLOY.md` en el repositorio del Starter Kit.

---

## Opción A: Vercel + MongoDB Atlas (Recomendado)

### 1. Preparar el Repositorio

```bash
git init
git add .
git commit -m "Initial commit: juan-tech-starter"
git remote add origin https://github.com/TU_USER/mi-sitio.git
git push -u origin main
```

### 2. Crear MongoDB Atlas Cluster

1. Ir a [mongodb.com/atlas](https://mongodb.com/atlas)
2. Crear cluster gratuito (M0 — 512MB storage, suficiente para empezar)
3. Elegir región más cercana a tu audiencia
4. Crear usuario de database:
   - Database: `mi-sitio`
   - Username: `admin`
   - Password: (generar seguro)
5. En "Network Access" → Permitir acceso desde cualquier IP (0.0.0.0/0) para Vercel
6. Copiar connection string:
   ```
   mongodb+srv://admin:PASSWORD@cluster.mongodb.net/mi-sitio?retryWrites=true&w=majority
   ```

### 3. Configurar Vercel

1. Ir a [vercel.com/import](https://vercel.com/import)
2. Seleccionar el repositorio de GitHub
3. Framework: Next.js (auto-detectado)
4. Build command: `pnpm build`
5. Output directory: `.next`
6. Install command: `pnpm install`

### 4. Variables de Entorno en Vercel

```
MONGODB_URI=mongodb+srv://admin:PASSWORD@cluster.mongodb.net/mi-sitio
PAYLOAD_SECRET=(generar secreto aleatorio de 64 caracteres)
PAYLOAD_PUBLIC_SERVER_URL=https://mi-sitio.vercel.app
```

Para el secreto:
```bash
openssl rand -base64 48
```

### 5. Configurar Storage (Vercel Blob o Cloudinary)

#### Opción A: Vercel Blob (más simple)
1. En dashboard de Vercel → Storage → Create Blob Store
2. Añadir variables de entorno automáticamente

#### Opción B: Cloudinary (más features)
1. Crear cuenta en cloudinary.com
2. Obtener Cloud Name, API Key, API Secret
3. Configurar en Payload CMS (`payload.config.ts`)

### 6. Primer Deploy

```bash
git push origin main
```

Vercel detecta el push y despliega automáticamente.
Tiempo de build: 2-4 minutos.

### 7. Configurar Dominio

1. Vercel → Settings → Domains → Add domain
2. Añadir `misitio.com`
3. Configurar DNS en tu proveedor:
   ```
   CNAME misitio.com → cname.vercel-dns.com
   ```
4. Esperar propagación (5-30 min)
5. Vercel emite certificado SSL automáticamente (Let's Encrypt)

### 8. Post-Deploy Checklist

- [ ] Visitar `https://misitio.com` — ¿carga?
- [ ] Visitar `https://misitio.com/admin` — ¿login funciona?
- [ ] Crear un post de prueba — ¿se publica?
- [ ] Sitemap: `https://misitio.com/sitemap.xml` — ¿se genera?
- [ ] Robots.txt: `https://misitio.com/robots.txt` — ¿existe?
- [ ] Lighthouse: puntuación >90?
- [ ] Google Search Console: añadir propiedad y enviar sitemap

---

## Opción B: Docker (Self-Hosted)

Para quienes prefieren no usar Vercel.

### docker-compose.yml incluido
```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/mi-sitio
      - PAYLOAD_SECRET=${PAYLOAD_SECRET}
      - PAYLOAD_PUBLIC_SERVER_URL=https://misitio.com
    depends_on:
      - mongo

  mongo:
    image: mongo:7
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

### Deploy
```bash
# En el servidor
docker-compose up -d
```

---

## Opción C: Railway / Render / Fly.io

Alternativas a Vercel. El starter es compatible con cualquier plataforma que soporte Node.js y Next.js. Solo necesita:
- Node.js 20+
- MongoDB (puede ser Atlas)
- Variables de entorno configuradas
