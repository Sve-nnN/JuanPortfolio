---
status: human_needed
phase: 3
verified: 2026-06-23
---

# Phase 3 Verification

## Success Criteria

1. ✓ Las 4 plantillas no llaman `headers()` en el render publicado; toman locale de `params`. `draftMode()` es bypass-cookie-gated (no fuerza dinámico) → build las muestra `●`.
2. ⏳ (human) Editor en Payload admin ve el borrador en live preview sin errores.
3. ✓ `draftMode()` solo cambia a render dinámico cuando la cookie `__prerender_bypass` (preview) está presente.

## Method

Build local: las 4 plantillas son `●` pese a llamar `draftMode()` → confirma el gating por cookie (research Next 15 + empírico). `LivePreviewListener` y el route handler `/next/preview` intactos.

## Human verification needed

- **Live preview de Payload** tras deploy: entrar al admin, abrir live preview de un post/página, editar sin publicar y confirmar que el iframe refleja los cambios. No reproducible en build local.
