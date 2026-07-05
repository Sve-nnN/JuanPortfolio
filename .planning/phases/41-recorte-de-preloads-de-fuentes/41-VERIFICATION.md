---
status: passed
phase: 41
requirements: [PERF-08]
commit: c63b29d
human_qa: passed 2026-07-05 (Juan — fuentes idénticas, sin FOUT)
---

# Phase 41 — Verification

## Automated (passed)

- [x] Solo Array Bold marcada para preload above-the-fold (instancia `ArrayBold`, `preload:true`); familia Array completa a `preload:false`.
- [x] Sin faux-weights: la familia Array completa sigue cargando (swap) para footer/prose/títulos.
- [x] GeistSans (dead code) eliminado.
- [x] tsc 112 (baseline, 0 nuevos en src/). `/` y `/en` → 200.

## Human verification needed (gate FOUT — Juan)

Con el dev server (http://localhost:3001), revisá que las fuentes se vean **idénticas**:

1. [ ] **H1 de la home** (`/` y `/en`): mismo peso/forma Array Bold, sin parpadeo de fuente al cargar.
2. [ ] **Logo del Footer** ("JCA" / logoText, usa `font-display` en peso normal): se ve igual que antes.
3. [ ] **Títulos y prose** de un post (ej. cualquier `/blog/...`): headings en Array como siempre.
4. [ ] No aparece texto con "peso raro" (faux bold/regular) ni salto de fuente perceptible.

**Nota:** el recorte de preloads solo se ve en build de producción, no en dev. Acá lo que validás es que **no hay regresión visual**; el número de preloads y su impacto se miden en la Fase 40.

**Si algo se ve distinto:** anotá el elemento y lo ajusto.
