# Phase 13 Summary: Eventos de engagement

**Completed:** 2026-06-24

## What changed
- `src/providers/Analytics/index.tsx` — scroll depth 25/50/75/100% (`scroll_depth`, ENG-01) + hitos de tiempo activo 30/60/120/300s (`content_engagement`, pausado en tab oculto, ENG-02). Reset por navegación (pathname).
- `src/Header/Nav/NavSearch.tsx` — submit emite `search` {search_term} (ENG-05).
- `src/components/Card/index.tsx` — links de cards (related/grids) con `gaAttrs('select_content')` {content_type,item_id} (ENG-03).
- `src/Footer/Component.tsx` — links de últimos posts/casos con `navigation_click` {location:footer} (ENG-04). Header/footer nav vía CMSLink ya emitían content_navigation.

## Requirements: ENG-01..05 ✓
