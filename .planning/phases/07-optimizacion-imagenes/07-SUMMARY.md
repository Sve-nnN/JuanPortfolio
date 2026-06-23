# Phase 7 Summary: Optimización de imágenes

**Completed:** 2026-06-23

## What changed

- `src/blocks/HeroHome/Component.tsx` — el retrato LCP pasa `width={640} height={640}` + `size` responsive. `Media`/`ImageMedia` reenvía width/height a `getOptimizedCloudinaryUrl` (transform `w_`), así Cloudinary sirve 640px en vez de 756px (display ~560px lg).
- `src/blocks/FeaturedClients/Component.tsx` — `buildLogoSrc` baja de 256×128 a 192×96 (display ~104×70, cubre DPR 2).

## Requirements

- IMG-01 ✓ (retrato LCP capeado a 640)
- IMG-02 ✓ (logos a 192×96)

## Verification

- Build verde; el `src` del retrato en `es.html` incluye `w_640`/`h_640`.
- Post-deploy: Lighthouse "Improve image delivery" baja vs baseline (~41KB).
