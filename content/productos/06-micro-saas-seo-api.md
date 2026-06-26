# Producto 6 (FUTURO): Micro-SaaS — API de Auditoría SEO

> **Prioridad:** ⚪ FUTURO (evaluar en 6-12 meses, cuando haya tráfico y audiencia)
> **Ingreso potencial:** $1,000 – $10,000 USD/mes
> **Esfuerzo inicial:** 80-200 horas
> **Mantenimiento:** Medio (hosting, actualizaciones, soporte)

---

## 1. Descripción

Un Micro-SaaS que ofrece una API para validar y monitorear aspectos técnicos de SEO: datos estructurados, Core Web Vitals, indexabilidad, metadatos. Los clientes son developers y agencias que quieren integrar validación SEO en sus CI/CD pipelines.

### ¿Por qué considerarlo a futuro?

- El mercado de "SEO API" está creciendo con herramientas como Ahrefs API, Semrush API
- Pocas APIs se enfocan en SEO **técnico** (la mayoría son de keywords/backlinks)
- Los developers están integrando cada vez más validaciones en CI/CD
- Si el blog gana autoridad en SEO técnico, una API propia es la extensión natural

### Riesgos

- Es el producto con mayor esfuerzo inicial y mayor mantenimiento
- Competir con herramientas establecidas requiere diferenciación clara
- El soporte al cliente puede consumir más tiempo del esperado
- Solo tiene sentido si el blog alcanza DR 30+ y tráfico significativo

---

## 2. Funcionalidades Propuestas

### MVP (Minimum Viable Product)

**API Endpoints:**

```
POST /api/v1/validate/schema
  - Valida JSON-LD contra Schema.org
  - Retorna errores, warnings, sugerencias

POST /api/v1/validate/meta
  - Revisa title tags, meta descriptions
  - Detecta missing, duplicates, too long/short

POST /api/v1/validate/performance
  - Ejecuta Lighthouse audit sobre una URL
  - Retorna Core Web Vitals + recomendaciones

GET /api/v1/crawl/preview
  - Simula cómo Googlebot ve una URL
  - Retorna HTML renderizado, recursos bloqueados
```

**Plan gratuito:** 10 validaciones/mes
**Plan Pro:** $19/mes — 500 validaciones/mes
**Plan Agency:** $79/mes — 5,000 validaciones/mes + acceso a CI/CD integration

### Funcionalidades Futuras (v2)

- Validación de robots.txt
- Detección de canibalización de keywords
- Monitoreo continuo (daily checks + alertas)
- Integración nativa con GitHub Actions, Vercel, Netlify
- Dashboard web con historial

---

## 3. Stack Técnico Recomendado

| Componente | Tecnología | Razón |
|------------|-----------|-------|
| API Backend | Next.js API Routes o Hono | Stack conocido, deploy fácil en Vercel |
| Lighthouse | Lighthouse CI / Puppeteer | Para pruebas de performance |
| Schema Validation | schema-dts + custom validator | Validación de JSON-LD |
| Rate Limiting | Vercel Edge Middleware | Protección de API |
| Auth & Billing | Clerk + Stripe | Manejo de usuarios y suscripciones |
| Database | Vercel Postgres o PlanetScale | Serverless-friendly |
| Queue (tareas largas) | Upstash QStash | Para Lighthouse audits asíncronos |
| Monitoring | Vercel Analytics + Sentry | Errores y performance |

---

## 4. Pricing y Proyección

| Plan | Precio/mes | Clientes (año 1) | MRR |
|------|-----------|-------------------|-----|
| Free | $0 | 200-500 | $0 |
| Pro | $19 | 50-150 | $950-2,850 |
| Agency | $79 | 10-30 | $790-2,370 |
| Enterprise | $199+ | 2-5 | $398-995 |
| **Total MRR** | | | **$2,100-6,200** |

---

## 5. Condiciones para Lanzar

Este producto solo debe considerarse cuando se cumplan **al menos 3 de estas 5 condiciones:**

- [ ] juan-tech.com tiene DR 25+
- [ ] El blog recibe 20,000+ visitas/mes
- [ ] Hay una lista de email de 1,000+ suscriptores
- [ ] Los Notion Templates y el Starter Kit están generando ingresos constantes
- [ ] Se ha validado demanda (encuesta a lectores, comments pidiendo API)

---

## 6. Tareas Preparatorias (para hacer desde ahora)

Incluso si no se construye ya, se puede ir preparando el terreno:

1. **Recolectar feedback:** En cada artículo de SEO técnico, preguntar a los lectores si les interesaría una API de validación
2. **Construir en público:** Compartir en Twitter el proceso de crear pequeñas herramientas de validación → medir interés
3. **Landing page waitlist:** Crear una página simple tipo "SEO Audit API — Coming Soon" con formulario de email
4. **Open source primero:** Publicar scripts de validación en GitHub como repos separados → si ganan stars, hay demanda

---

## 7. Conclusión

El Micro-SaaS es el producto con mayor upside pero también mayor riesgo. La secuencia recomendada es:

1. **Primero:** Notion Templates + Starter Kit (bajo riesgo, ingresos rápidos)
2. **Después:** Ebook + Consultoría (ingresos medios, construye autoridad)
3. **Cuando haya tracción:** Evaluar el Micro-SaaS con datos reales de demanda

No construir el SaaS sin haber validado que hay mercado. Los otros 5 productos pueden generar $3,000-10,000/mes combinados con mucho menos riesgo.
