# Design System — juan-tech.com (v1.8 refresh)

Fuente de verdad del refresh de UX/UI. Derivado de `ui-ux-pro-max` (`--design-system`: patrón *Portfolio Grid*, estilo *Motion-Driven*, CTA azul, reduced-motion) + la identidad existente. Enfoque: **refresh dentro de identidad, no rebrand**. Dark mode es el default.

Las fases 45-51 refrescan cada superficie consumiendo estos tokens; no se re-definen tokens fuera de acá.

## Color (OKLCH — `globals.css`)

Se mantiene la paleta: `--primary` azul (hue 250), neutros hue 220, dark default. Cambio de a11y aplicado:

- `--muted-foreground` (dark) 0.65 → **0.72** para clear del contraste 4.5:1 en texto muted/secundario.
- Regla: cualquier texto de cuerpo debe cumplir **≥ 4.5:1** contra su fondo; nunca usar `muted-foreground` para texto crítico chico.

Roles: `background/foreground`, `card`, `popover`, `primary` (CTA/enlaces/acento), `secondary`, `muted` (texto atenuado), `accent`, `destructive`, `border`, `input`, `ring` (foco).

## Tipografía

Se mantienen las fuentes de marca:
- **Array** (`font-display`/`--font-array`) — headings/display. Solo Array Bold preloadeada (v1.7).
- **Khand** (`--font-khand`) — UI/body.
- **Geist Mono** — código.

Reglas de lectura:
- Body `line-height` 1.5–1.75 (hoy 1.6 ✓).
- Prose: ancho de lectura **65–75ch** (`max-w-[70ch]` o prose por defecto). No dejar líneas full-width.
- Headings `line-height` ~1.1 ✓.

## Spacing

Escala base-4/8. Preferir los steps de Tailwind (`gap-4/6/8/12/16`, `p-*`) de forma consistente por tipo de componente; evitar valores arbitrarios salvo necesidad. Contenedores: un solo `max-w` por familia de página (no mezclar `max-w-6xl`/`7xl` al azar).

## Radius

`--radius: 1rem`. Escala Tailwind: `rounded-lg` (=radius), `rounded-md`, `rounded-sm`, `rounded-full`. Intención: **botones** `rounded-full`/`lg`, **cards** `rounded-lg`, inputs `rounded-md`. No mezclar sin criterio.

## Motion (tokens en `globals.css` + `tailwind.config.js`)

- Easing: `--ease-standard` (`cubic-bezier(.25,.1,.25,1)`, = curva del hero v1.7), `--ease-out`. Tailwind: `ease-standard`, `ease-out`.
- Duración: `--duration-fast` 150ms, `--duration-base` 250ms, `--duration-slow` 400ms. Tailwind: `duration-fast/base/slow`.
- **Solo `transform`/`opacity`** (compositor). Nada de animar `width/height/top/left`.
- Micro-interacciones 150–300ms. Hover **sin layout shift** (color/opacity/shadow, no `scale` que desplace).
- **`prefers-reduced-motion`**: toda animación se desactiva/atenúa. Utilidad `.transition-standard` ya lo respeta; `scroll-behavior` cae a `auto`.
- Utilidad `.transition-standard` en vez de `transition-all`.

## A11y / interacción (DS-02)

- **Foco:** ring visible global vía `:focus-visible` (outline 2px `--ring`). No removerlo sin reemplazo.
- **Touch targets:** ≥ 44×44px. Utilidad `.min-touch` para controles chicos / icon-only.
- **Iconos:** Lucide (SVG). Cero emojis como iconos. Botones icon-only con `aria-label`.
- **Cursor:** `cursor-pointer` en todo clickeable.
- **Inputs:** `<label>` asociado siempre; estados de error claros y cercanos; botón `disabled` durante async.
- **z-index:** usar la escala (`z-base/sticky/dropdown/overlay/modal` = 0/10/20/30/50). Nada de `z-[9999]`.

## Responsive

Verificar en **375 / 768 / 1024 / 1440**. Sin scroll horizontal. Imágenes `max-w-full`.

## No regresionar (v1.7)

Hero server component + parallax CSS (`--sy`), animaciones compositor-only, preload de solo Array Bold, LCP/CLS. El refresh no vuelve a meter framer-motion above-the-fold ni animaciones que layouteen.

## Pre-Delivery Checklist (por componente)

- [ ] Sin emojis como iconos (SVG Lucide)
- [ ] `cursor-pointer` en clickeables; hover con feedback sin shift; transición 150–300ms (`.transition-standard`)
- [ ] Contraste ≥ 4.5:1; foco visible; touch ≥ 44px; `aria-label` en icon-only; `<label>` en inputs
- [ ] Motion transform/opacity + `prefers-reduced-motion`
- [ ] Responsive 375/768/1024/1440, sin scroll horizontal
- [ ] Radius/spacing/z-index del sistema
- [ ] Sin regresión de v1.7 ni de identidad de marca
- [ ] tsc baseline (0 nuevos en `src/`), tests verdes
