# Phase 45: Primitivas UI compartidas — Summary

**Completed (code):** 2026-07-05
**Commit:** `6737537`
**Requirements:** UIKIT-01
**Status:** Código hecho · gate QA visual pendiente (Juan)

## Qué se hizo

Alineación de `components/ui/*` al design-system v1.8. Las primitivas ya eran razonables (el oversizing estaba en el *uso*, no en los primitives), así que fue un pass liviano de consistencia a tokens:

- **button:** `transition-all`→`transition-standard`, `cursor-pointer` explícito, `disabled:cursor-not-allowed`.
- **input / textarea:** `rounded`→`rounded-md`; input `h-10`→`h-11` (44px touch target).
- **card:** `transition-all duration-300`→`transition-standard`; `rounded-[2rem]`→`rounded-3xl` (token).
- **select:** trigger `h-10`→`h-11` + `cursor-pointer` + `rounded-md`; panel `z-50`→`z-dropdown` + `rounded-md`; items `cursor-default`→`cursor-pointer` + `rounded-md`.
- **accordion:** trigger `transition-all`→`transition-standard` + `cursor-pointer`.

Sin cambios: checkbox, label, pagination (ya consistentes).

## Nota sobre tamaños (foco de Juan)

Los defaults de los primitives (button `h-12 px-6`, input `h-11`) ya son proporcionados. El right-sizing pesado va en las superficies (45-51) donde se usan con clases infladas — ver `docs/design-system.md` (Densidad).

## Verificación de código

- **tsc:** 112 (baseline, 0 nuevos en `src/`).
- **Dev:** `/`, `/en`, `/contact` → 200, sin errores. APIs de los componentes intactas (solo clases).

## Pendiente de Juan (gate)

QA visual: botones/inputs/selects/accordion se ven consistentes, foco visible, touch targets cómodos, hover sin shift. Ver `45-VERIFICATION.md`.
