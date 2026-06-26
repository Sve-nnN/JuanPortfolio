# 06 — Guías Complementarias del Starter Kit

> Documentación adicional que añade valor al producto y reduce la carga de soporte.

---

## 1. Guía de Personalización (`CUSTOMIZATION.md`)

### Colores
```javascript
// tailwind.config.js
colors: {
  brand: {
    50: '#f0f4ff',
    100: '#dbe4ff',
    // ... definir paleta completa
    900: '#1a1a2e',
  }
}
```

### Fuentes
```typescript
// src/app/(frontend)/layout.tsx
import { Inter, Source_Serif_4 } from 'next/font/google'

const sans = Inter({ subsets: ['latin'], variable: '--font-sans' })
const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-serif' })
```

### Layout
- Cambiar hero section: `src/app/(frontend)/page.tsx`
- Cambiar footer: `src/components/Footer.tsx`
- Cambiar header: `src/components/Header.tsx`

### Landing page
El starter incluye una homepage genérica con:
- Hero con CTA
- Sección de posts recientes
- Sección de categorías
- Newsletter CTA

Todo es reemplazable. Cada sección está en su propio componente.

---

## 2. Guía de Migración desde WordPress (`MIGRATION.md`)

### Paso 1: Exportar contenido de WordPress
```bash
# WP Admin → Tools → Export → All Content
# Descarga el XML
```

### Paso 2: Convertir a Markdown
```bash
# Usar wordpress-export-to-markdown (npm)
npx wordpress-export-to-markdown
```

### Paso 3: Importar a Payload CMS
```bash
# Script incluido en el starter
pnpm import:wp --source=./exported-posts
```

### Paso 4: Configurar redirecciones
Mapear URLs antiguas de WordPress a nuevas URLs:
```json
// redirects.json
[
  { "source": "/2025/:slug", "destination": "/blog/:slug", "permanent": true },
  { "source": "/category/:cat/:slug", "destination": "/blog/:slug", "permanent": true }
]
```

### Paso 5: Verificar SEO post-migración
- [ ] Sitemap contiene todas las URLs nuevas
- [ ] Canonical tags correctos
- [ ] Meta descriptions preservadas
- [ ] Redirecciones 301 funcionando
- [ ] Google Search Console: Address Change tool

---

## 3. Guía de Mantenimiento

### Actualizaciones mensuales (15 min)
```bash
pnpm update
pnpm generate:types
git commit -am "chore: update dependencies"
```

### Revisión trimestral (1 hora)
- Revisar Core Web Vitals en Search Console
- Verificar que no hay URLs 404 en GSC
- Actualizar contenido de ejemplo si es necesario

### Actualizaciones mayores (Next.js, Payload CMS)
- Revisar changelogs antes de actualizar
- Probar en staging primero
- El starter incluye tests e2e para verificar que nada se rompe

---

## 4. FAQ del Starter Kit

**Q: ¿Necesito saber TypeScript?**
A: Sí. El starter está en TypeScript estricto. Si sabes JavaScript moderno, TypeScript es un paso pequeño.

**Q: ¿Puedo usar npm en vez de pnpm?**
A: Técnicamente sí, pero el lockfile está en pnpm. Recomendamos pnpm por velocidad y ahorro de disco.

**Q: ¿Funciona sin Docker?**
A: Necesitas MongoDB corriendo de alguna forma. Docker es la más fácil. Alternativas: MongoDB Atlas (gratis), instalación nativa.

**Q: ¿Puedo cambiar de MongoDB a PostgreSQL?**
A: Payload CMS soporta PostgreSQL. El starter usa MongoDB por simplicidad, pero migrar es posible. Contactar para guía.

**Q: ¿Las actualizaciones son gratis?**
A: Sí. Todas las actualizaciones del mismo tier son gratis de por vida.

**Q: ¿Qué pasa si encuentro un bug?**
A: Abre un issue en GitHub. Respuesta en <48 horas. Bugs críticos: <24 horas.

**Q: ¿Ofreces setup personalizado?**
A: Sí. Los tiers PRO y Enterprise incluyen sesiones de consultoría 1:1.
