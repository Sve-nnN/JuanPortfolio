---
status: human_needed
phase: 39
requirements: [PERF-04, PERF-05, PERF-06]
commit: 41a308d
---

# Phase 39 — Verification

## Automated (passed)

- [x] **PERF-04** — El H1 se renderiza en el HTML de SSR (Component.tsx ya no es `'use client'`, sin imports de framer-motion). LCP no depende de la hidratación del hero.
- [x] **PERF-06** — framer-motion removido del hero (above-the-fold). Único JS: `HeroScroll.client.tsx` (~55 líneas, sin deps).
- [x] tsc 112 (baseline, 0 nuevos en src/).
- [x] Tests: sin fallos en hero/block/component (2 int flaky de red no relacionados).

## Human verification needed (gate de QA visual — Juan)

Correr `pnpm dev`, abrir la home en **mobile** (DevTools responsive o teléfono real), comparar contra prod/`main`:

1. [ ] **Entrance:** el badge, H1, descripción y CTAs suben (slide-up) escalonados igual que antes (~0.1s entre cada uno, ~0.8s cada uno). Sin flash ni salto.
2. [ ] **Retrato:** entra con scale/rotate (de 0.85/8° a 1/3°) en ~1.5s, igual que antes.
3. [ ] **Parallax de scroll:** al scrollear, el fondo (blobs) y la columna de texto se desplazan y se desvanecen; el retrato se achica levemente. Debe sentirse idéntico al comportamiento actual.
4. [ ] **Layout:** grid, tipografías, espaciados y el H1 pintado desde el primer frame, sin CLS.
5. [ ] **Reduced motion:** con "reduce motion" activado, el hero aparece estático sin animación (retrato en rotate 3°).

**Si algo se ve distinto:** anotá qué (elemento + qué difiere) y lo ajusto antes de mergear. Este es tu no-negociable de UX.

## Métrica (queda para Fase 40)

Re-medir chunks/TBT con build + Unlighthouse mobile para confirmar el recorte de JS.
