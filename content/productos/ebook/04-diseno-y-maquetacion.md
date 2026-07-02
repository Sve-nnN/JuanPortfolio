# 04 — Diseño y Maquetación del Ebook

---

## Especificaciones Técnicas del PDF

| Parámetro | Valor |
|-----------|-------|
| Formato | PDF (principal) + EPUB (secundario) |
| Tamaño de página | US Letter (8.5 × 11 in) |
| Márgenes | 1 in (2.54 cm) todos los lados |
| Fuente cuerpo | Inter (sans-serif, 10.5pt) |
| Fuente código | JetBrains Mono (monospace, 9pt) |
| Fuente títulos | Inter Bold |
| Interlineado | 1.5 |
| Color de acento | #2563EB (blue-600) |
| Número de páginas | 180-220 |

---

## Estructura Visual de Cada Capítulo

```
┌─────────────────────────────────────────┐
│                                         │
│   CAPÍTULO 3                             │
│   Renderizado Web y SEO                 │
│                                         │
│   [Quote block: 1-2 frases]             │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│   Contenido del capítulo...             │
│                                         │
│   ## CSR vs SSR vs SSG vs ISR           │
│   Texto explicativo...                  │
│                                         │
│   > ⚡ KEY INSIGHT:                      │
│   > Google renderiza JavaScript pero    │
│   > con delay de días o semanas.        │
│                                         │
│   ### Código: Next.js SSR               │
│   ┌─────────────────────────────────┐   │
│   │ // app/page.tsx                  │   │
│   │ export default async function... │   │
│   │   const data = await fetch(...)  │   │
│   │   return <Page data={data} />    │   │
│   └─────────────────────────────────┘   │
│                                         │
│   [Diagrama: flujo de renderizado]       │
│                                         │
│   ## Caso Real: ...                     │
│                                         │
├─────────────────────────────────────────┤
│   En el próximo capítulo...              │
│                                         │
└─────────────────────────────────────────┘
```

---

## Elementos Visuales

### 1. Callouts (5 tipos)

| Tipo | Color | Ícono | Uso |
|------|-------|-------|-----|
| Key Insight | Azul | ⚡ | Concepto importante |
| Warning | Ámbar | ⚠️ | Error común, cuidado |
| Code Deep Dive | Verde | 💻 | Explicación de código |
| Case Study | Púrpura | 🔬 | Caso real documentado |
| Pro Tip | Gris | 🔧 | Consejo de experto |

### 2. Diagramas

Los capítulos que requieren diagramas:

| Capítulo | Diagrama | Herramienta |
|----------|----------|-------------|
| Cap 1 | Pipeline Google: Crawl → Index → Rank | Excalidraw |
| Cap 2 | Arquitectura de URLs: plana vs profunda | Excalidraw |
| Cap 3 | Flujo SSR vs SSG vs ISR | Mermaid.js |
| Cap 5 | Core Web Vitals thresholds | Figma |
| Cap 7 | Topic Cluster: pillar + satellites | Excalidraw |
| Cap 9 | Hreflang decision tree | Excalidraw |
| Cap 11 | Migration flow chart | Mermaid.js |

### 3. Tablas

Estilo limpio, sin zebra striping, bordes finos (#E5E7EB):

```
┌────────────────┬──────────────┬──────────────┐
│ Métrica        │ Bueno        │ Pobre        │
├────────────────┼──────────────┼──────────────┤
│ LCP            │ ≤ 2.5s       │ > 4.0s       │
│ CLS            │ ≤ 0.1        │ > 0.25       │
│ INP            │ ≤ 200ms      │ > 500ms      │
└────────────────┴──────────────┴──────────────┘
```

---

## Portada

### Diseño
- Fondo oscuro (#0F172A) con gradiente sutil
- Título en blanco, fuente Inter Bold, 36pt
- Subtítulo en gris claro (#94A3B8), 14pt
- Nombre del autor en azul (#3B82F6)
- Ícono o ilustración minimalista relacionada con código/SEO
- Sin imágenes de stock genéricas

### Texto de portada
```
        SEO TÉCNICO PARA
        DESARROLLADORES

   Guía Completa de Optimización Técnica
      para Ingenieros de Software

        JUAN CARLOS ANGULO
```

### Contraportada
- Bio corta del autor (3-4 líneas)
- Bullet points de lo que aprenderás
- URL del blog: juan-tech.com
- Código QR al blog

---

## Herramientas de Maquetación

### Opción A: Google Docs → PDF (recomendado para empezar)
- **Ventaja:** Gratis, familiar, exportación directa a PDF
- **Desventaja:** Menos control tipográfico, sin sintaxis highlighting nativo
- **Workaround para código:** Capturas de pantalla de bloques de código (Carbon.sh o similares) insertadas como imágenes

### Opción B: Figma → PDF
- **Ventaja:** Control total de diseño, tipografía profesional
- **Desventaja:** Más trabajo, exportación manual

### Opción C: LaTeX (Overleaf)
- **Ventaja:** Calidad tipográfica profesional, sintaxis highlighting nativo (minted)
- **Desventaja:** Curva de aprendizaje
- **Recomendado si:** El ebook tiene mucho código (que es el caso)

### Opción D: Softcover.io o Leanpub
- **Ventaja:** Publicación multi-formato (PDF, EPUB, MOBI)
- **Desventaja:** Comisión, menos control de diseño

---

## EPUB

El EPUB se genera desde la misma fuente que el PDF. Diferencias clave:
- Sin diseño fijo (reflowable)
- Fuentes del sistema del lector
- Código en blanco y negro (sin syntax highlighting)
- Sin diagramas complejos (reemplazar por descripciones textuales)
