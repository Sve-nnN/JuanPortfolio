# Phase 12 Summary: Eventos de conversión

**Completed:** 2026-06-24

## What changed
- `src/Header/Component.client.tsx` — `toggleLocale` emite `language_switch` {from,to} (CONV-04).
- `src/blocks/CalendlyEmbed/Component.tsx` — listener de postMessage `calendly.event_scheduled` (origin calendly.com) → `schedule_meeting` (CONV-02).
- `src/blocks/Form/Component.tsx` — submit del Payload Form emite `generate_lead` {status:success/error, form} (CONV-01).
- `src/components/home/ContactForm.tsx` — botón + mailto/tel con `gaAttrs('cta_click')` (CONV-03).
CTAs vía CMSLink ya emitían `cta_click` (existente).

## Requirements: CONV-01..04 ✓
