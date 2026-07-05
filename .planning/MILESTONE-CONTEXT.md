# Milestone Context — v1.8 Refresh de UX/UI del sitio público

_Wired por Claude a pedido de Juan (2026-07-05). Pasada de diseño a todos los componentes del sitio público con el skill **ui-ux-pro-max**, refrescando y modernizando de forma cohesiva. Ejecutar `/gsd:new-milestone` para formalizar requirements + roadmap; este archivo pre-carga el scope._

## Milestone propuesto: v1.8 Refresh de UX/UI (sitio público)

**Goal:** Pasar el skill `ui-ux-pro-max` por todos los componentes del sitio público, derivar un design-system refrescado (paleta/tipografía/espaciado/efectos/motion/a11y) y aplicarlo componente por componente para modernizar el look sin romper identidad ni regresionar el rendimiento logrado en v1.7 (QA visual obligatorio por superficie).

## Decisiones tomadas (Juan, 2026-07-05 — recomendadas, sin respuesta explícita)

- **Alcance:** solo **sitio público** (no admin de Payload — recién saneado en v1.5).
- **Profundidad:** **refresh guiado por design-system** (modernizar dentro de la identidad actual), NO rebrand desde cero.
- **v1.7:** **parkeada** (fases 38/40/42/43 quedan abiertas para cuando Juan tenga la data/acceso; el código de 39 y 41 ya está hecho).

> Confirmar estas 3 al correr `/gsd:new-milestone`; si Juan quiere rebrand completo o incluir admin, cambia el roadmap.

## Herramienta de ejecución

**ui-ux-pro-max** (design intelligence: 50 estilos, 97 paletas, 57 pairings tipográficos, 99 guías UX, 25 charts, stacks nextjs/shadcn). Ubicación: `~/.claude/skills_backup/ui-ux-pro-max/` (skill; requiere permiso para ejecutar su `scripts/search.py` — ver nota de permisos en el reporte de sesión).

Flujo por el skill:
1. `search.py "<producto> <industria> <keywords>" --design-system` → sistema base (una vez, Fase de fundación).
2. `search.py "<keyword>" --domain style|color|typography|ux|landing` → detalle por necesidad.
3. `search.py "<keyword>" --stack nextjs` y `--stack shadcn` → best practices de implementación.
4. Aplicar el Pre-Delivery Checklist del skill antes de cada entrega (no emojis como iconos, cursor-pointer, hover sin layout shift, contraste 4.5:1, focus states, reduced-motion, responsive 375/768/1024/1440).

## Punto de partida (tokens actuales — anclar el refresh)

- **Color:** OKLCH. `--primary` hue 250 (azul), `--background/foreground` hue 220. Dark mode por defecto (`class="dark"` fijo en root).
- **Radius:** `--radius: 1rem`.
- **Tipografía:** Array (headings/display, local), Khand (UI/sans, local), Geist Mono (code). Array Bold preloadeada (v1.7).
- **Motion:** blobs y pulse en CSS compositor; hero con parallax CSS (`--sy`) + entrance keyframes (v1.7).

## Inventario de componentes (candidatos a fasear)

**Chrome global:** `Header/` (Component + Nav + mobile menu), `Footer/`, `Logo`, `Breadcrumbs`, `DynamicBackground`.

**Home:** `HeroHome` (ya refactorizado en v1.7 → toque liviano), `AboutSection`, `AboutWithFeatures`, `FeaturedWorks`/`WorkCards`, `FeaturedClients`/`ClientsCarousel`/`ClientsMarquee`, `FeaturedBlog`/`LatestBlogPosts`, `TestimonialSection`/`TestimonialsCarousel`, `ResultsSection`, `SimpleCTA`/`CallToAction`, `ContactFormBlock`, `components/home/*`.

**Blog listing & archivo:** `BlogArchiveHeader`, `ArchiveBlock`, `PostsGrid`, `CollectionArchive`, `Card`, `Pagination`/`PageRange`, `CategoryExplore`/`CategoryFAQ`, `ListingHero`, `BlogListingLayout`.

**Post / artículo:** `PostHero`/`PostArticleHeader`, `Content`, `RichText`, `Code`, `TableOfContents`/`TableOfContentsBlock`, `PostSidebar`/`SidebarBanners`, `RelatedPosts`/`RelatedPostsBlock`, `FAQ`, `AuthorCard`, `SGEAtomicAnswer`.

**Case studies:** `CaseStudyHeader`, `CaseStudiesGrid`, `FeaturedCaseStudies`, `LatestCaseStudies`, `ResultsSection`.

**Formularios & interactivos:** `Form`/`FormBlock`, `ContactForm`, `CalendlyEmbed`, `Turnstile`, `Banner`, `Intro`, `MediaBlock`, `Section`, `SimpleCTA`.

**Primitivas UI compartidas:** `components/ui/*` (button, accordion, select, checkbox, label, etc.) — la base tipo shadcn que heredan todos.

## Restricciones (constantes en todas las fases)

- **QA visual obligatorio por superficie** antes de mergear (prioridad UX de Juan). Comparar antes/después en mobile + desktop.
- **No regresionar v1.7:** hero server component, animaciones CSS compositor-only (transform/opacity), preloads de fuentes, LCP/CLS. Toda animación nueva respeta `prefers-reduced-motion`.
- **Identidad:** mantener dark-mode-default y la personalidad de marca; refrescar dentro de ella (salvo que Juan opte rebrand).
- **A11y (CRITICAL del skill):** contraste ≥ 4.5:1, focus states visibles, touch targets ≥ 44px, aria-labels en botones icon-only, labels en inputs.
- **Iconos:** SVG (Lucide), nunca emojis (ya es convención desde v1.5).
- **Calidad:** tsc baseline (0 nuevos en `src/`), tests verdes en cada fase.

## Fuera de alcance

- Admin de Payload (interno, saneado en v1.5).
- Reescritura de contenido / copy.
- Nuevas páginas o features (esto es refresh de componentes existentes, no scope nuevo).
- Cambios de modelo de datos / backend.

## Numeración

Continúa tras v1.7 (que termina en fase 43) → v1.8 arranca en **fase 44**.
