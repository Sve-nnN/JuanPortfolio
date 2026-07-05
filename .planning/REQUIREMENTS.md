# Requirements — Milestone v1.8 (Refresh de UX/UI del sitio público)

Derivado de: pedido de Juan (pasar `ui-ux-pro-max` por todos los componentes públicos y refrescarlos) + inventario y tokens actuales.
Herramienta de ejecución: **ui-ux-pro-max** (design intelligence). Detalle de scope: histórico en el MILESTONE-CONTEXT consumido (ver PROJECT.md).

**Enfoque:** refresh guiado por design-system (modernizar dentro de la identidad actual, dark-mode-default), NO rebrand. Aplicado por superficie con **QA visual obligatorio** antes de mergear cada una.

Convención label GitHub: `ui`, `design`, bloque `refresh`, tanda `v1.8-uiux`.

## Definición de "refrescado" (Definition of Done por componente)

Un componente está refrescado cuando cumple el **Pre-Delivery Checklist** del skill:
- **A11y (CRITICAL):** contraste ≥ 4.5:1, focus states visibles, touch targets ≥ 44px, aria-labels en botones icon-only, labels en inputs.
- **Interacción:** `cursor-pointer` en clickeables, hover con feedback sin layout shift, transiciones 150-300ms.
- **Visual:** iconos SVG (Lucide) consistentes, sin emojis como iconos, sombras/espaciado/radius del sistema, spacing coherente.
- **Responsive:** sin scroll horizontal, correcto en 375/768/1024/1440.
- **Motion:** solo `transform`/`opacity` (compositor), respeta `prefers-reduced-motion`.
- **Sin regresión:** identidad de marca intacta, y **no** se regresiona el rendimiento de v1.7 (hero SSR, animaciones CSS, preloads, LCP/CLS).
- **Calidad:** tsc baseline (0 nuevos en `src/`), tests verdes.

## v1.8 Requirements

### Fundación design-system
- [ ] **DS-01**: Se corre `ui-ux-pro-max --design-system` para el portfolio y se fija un design-system refrescado documentado (paleta OKLCH, tipografía, escala de spacing, radius, sombras, lenguaje de motion) en `globals.css` + `tailwind.config.js`, partiendo de los tokens actuales (primary hue 250, radius 1rem, dark default).
- [ ] **DS-02**: Baseline de a11y y tokens de interacción (focus ring, estados hover/disabled, z-index scale 10/20/30/50) definidos una sola vez y consumidos por el resto de los componentes.

### Chrome global
- [ ] **CHROME-01**: Header (desktop + nav) refrescado al sistema, cumpliendo el DoD.
- [ ] **CHROME-02**: Menú mobile del Header refrescado (touch targets, focus trap, animación reduced-motion-safe).
- [ ] **CHROME-03**: Footer refrescado al sistema.
- [ ] **CHROME-04**: Logo, Breadcrumbs y DynamicBackground refrescados/consistentes con el sistema.

### Home
- [ ] **HOME-01**: Secciones de contenido de la home (AboutSection/AboutWithFeatures, ResultsSection) refrescadas.
- [ ] **HOME-02**: FeaturedWorks/WorkCards y FeaturedClients/ClientsCarousel/ClientsMarquee refrescados.
- [ ] **HOME-03**: FeaturedBlog/LatestBlogPosts y Testimonials (Section + Carousel) refrescados.
- [ ] **HOME-04**: CTAs de la home (SimpleCTA, CallToAction, ContactFormBlock) refrescados.
- [ ] **HOME-05**: HeroHome revisado con toque liviano (ya refactorizado en v1.7 — solo alinear al sistema sin tocar la estructura server/parallax).

### Blog listing & archivo
- [ ] **BLOG-01**: BlogArchiveHeader, ListingHero y BlogListingLayout refrescados.
- [ ] **BLOG-02**: PostsGrid, ArchiveBlock, CollectionArchive y Card refrescados (grid, hover de card sin shift).
- [ ] **BLOG-03**: Pagination/PageRange y CategoryExplore/CategoryFAQ refrescados.

### Post / artículo
- [ ] **POST-01**: PostHero/PostArticleHeader refrescados.
- [ ] **POST-02**: Content/RichText/Code (tipografía de lectura, line-height 1.5-1.75, line-length 65-75, bloques de código) refrescados.
- [ ] **POST-03**: TableOfContents/TableOfContentsBlock, PostSidebar/SidebarBanners refrescados.
- [ ] **POST-04**: RelatedPosts/RelatedPostsBlock, FAQ, AuthorCard y SGEAtomicAnswer refrescados.

### Case studies
- [ ] **CASE-01**: CaseStudyHeader, CaseStudiesGrid, FeaturedCaseStudies, LatestCaseStudies refrescados.

### Formularios & interactivos
- [ ] **FORM-01**: Form/FormBlock, ContactForm y Turnstile refrescados (estados de error/loading claros, labels, botón disabled en async).
- [ ] **FORM-02**: CalendlyEmbed, Banner, Intro, MediaBlock, Section refrescados/consistentes.

### Primitivas UI compartidas
- [ ] **UIKIT-01**: `components/ui/*` (button, accordion, select, checkbox, label, etc.) alineadas al design-system refrescado — base que heredan todos los demás componentes.

## Future Requirements (deferidos)
- Refresh del admin de Payload (interno; fuera de este milestone).
- Rebrand visual completo (nueva identidad) — solo si Juan lo decide en un milestone propio.
- Modo claro pulido a fondo (hoy dark es el default; el refresh mantiene ambos pero la prioridad es dark).

## Out of Scope
- Admin de Payload.
- Reescritura de contenido/copy.
- Nuevas páginas o features (esto es refresh de componentes existentes).
- Cambios de modelo de datos / backend.
- Regresionar los cambios de rendimiento de v1.7.

## Dependencias / notas
- **UIKIT-01 primero o temprano:** las primitivas alimentan a casi todo; conviene fijar el sistema (DS-01/02) y las primitivas antes de las superficies para no re-tocar.
- **Herramienta:** `ui-ux-pro-max` requiere permiso para ejecutar su `search.py` (deny rule de auto-mode). Resolver antes de la fase de fundación (DS-01).

## Traceability (REQ → fase)

_Se completa cuando el roadmapper cree ROADMAP.md._
