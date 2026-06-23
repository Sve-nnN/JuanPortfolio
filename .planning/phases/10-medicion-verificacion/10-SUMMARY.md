# Phase 10 Summary: Medición & verificación

**Completed:** 2026-06-23

## Verificación estructural (next build local)

- ✅ **Calendly diferido**: el HTML inicial de `/` NO contiene `assets.calendly.com`, `js.stripe.com`, ni `booking-*.js/css`. `calendly-inline-widget` count = **0** en SSR (montado solo en viewport).
- ✅ **Retrato LCP**: src Cloudinary con `w_640,h_640,f_avif,q_auto` (antes 756px).
- ✅ **Logos**: `buildLogoSrc` a 192×96 (antes 256×128).
- ✅ **Ahrefs**: `strategy="lazyOnload"`.
- ✅ **Footer a11y**: svg `lucide-arrow-up-right` con `aria-hidden="true"`; links con texto/fallback.
- ✅ `next build` exit 0; `tsc -p tsconfig.verify.json` exit 0.

## VERIFY-01 (Lighthouse) — post-deploy

La medición exacta de LCP/TBT (mobile, Slow 4G) es flaky en local y depende del edge de Vercel/Cloudflare. Se confirma post-deploy con Lighthouse. **Expectativa fuerte**: sacar ~2.9MB (Calendly+Stripe) del load inicial baja TBT (1740ms→) y LCP de forma sustancial; el resto (imágenes, Ahrefs idle) suma.

## Requirements

- VERIFY-02 ✓ (build verde; sin regresión estructural)
- VERIFY-01 ⏳ (Lighthouse real post-deploy)

## Human-needed (post-deploy)

- Lighthouse mobile en juan-tech.com → confirmar LCP/TBT/Perf vs baseline (36 / 8.6s / 1740ms).
- DevTools Network: Calendly/Stripe cargan al scrollear; widget funciona.
