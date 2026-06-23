# Phase 6 Summary: Diferir Calendly

**Completed:** 2026-06-23

## What changed

`src/blocks/CalendlyEmbed/Component.tsx` — el widget de Calendly ya no se monta en el load inicial:
- `IntersectionObserver` (rootMargin 300px) detecta cuando la sección se acerca al viewport → recién ahí se renderiza el `<div calendly-inline-widget>` y se inyecta `widget.js`.
- Hasta entonces solo se renderiza el placeholder/loader (sin red).
- Fallback: si no hay `IntersectionObserver`, carga eager.
- `widget.js` pasa de `lazyOnload` a `afterInteractive` PERO solo se monta cuando `inView`, así que no carga hasta el scroll.

## Por qué

`widget.js` auto-inicializa cualquier `.calendly-inline-widget` presente en el DOM → bajaba ~2.6MB (booking.js 1.27MB + booking.css 1.27MB) + Stripe 231KB en el load inicial, aunque la sección estuviera bajo el fold. Eso dominaba LCP/TBT.

## Requirements

- TP-01 ✓ (widget montado solo en viewport)
- TP-02 ✓ (Stripe, inyectado por Calendly, ya no carga inicialmente)

## Verification

- Build verde; el HTML inicial de `/` no referencia `assets.calendly.com/.../widget.js` ni `booking-*` hasta el scroll (gate por `inView`).
- Human/post-deploy: confirmar en DevTools Network que Calendly/Stripe cargan al scrollear y el widget funciona.
