# Analytics event taxonomy (GA4)

How events are emitted and the canonical names/params. Milestone v1.2.

## How it works

1. **`trackEvent(event, params)`** (`src/utilities/analytics.ts`) pushes a structured
   event to the GTM **dataLayer** via `sendGTMEvent`. No direct `gtag` call — a
   single GA4-Event tag in GTM forwards everything to GA4 (see
   `analytics-gtm-setup.md`), so there's no double counting.
2. **`gaAttrs(event, params)`** returns `data-*` attributes. Spread them on ANY
   element (even server components) and the global **`AnalyticsProvider`**
   (`src/providers/Analytics`) click-delegation captures the click and emits the
   event. No need to make the component a client component.
3. Generic **outbound clicks, downloads, scroll-90%, site-search** are handled by
   GA4 **Enhanced Measurement** (configure in GA4). We only add what it doesn't
   cover (granular scroll milestones, custom conversions, content engagement).

## Conventions

- Event names: `snake_case`. Reuse GA4 **recommended events** where they fit
  (`generate_lead`, `search`, `select_content`).
- Params: `snake_case`, values < 100 chars, typed (string/number/boolean).
- **No PII**: `trackEvent` strips keys matching email/phone/name/etc. Never pass
  user input verbatim.

## Catalog

| Event | When | Key params | Phase |
|-------|------|-----------|-------|
| `cta_click` | Primary/secondary CTA or tracked button | `label`, `location`, `variant`, `url` | 11/12 |
| `navigation_click` | Header/footer nav link | `label`, `location`, `url` | 13 |
| `social_engagement` | Social profile link | `network`, `url` | 11 |
| `content_navigation` | Internal content link | `destination`, `label` | 11 |
| `outbound_click` | (reserved) — prefer Enhanced Measurement | `url` | — |
| `generate_lead` | Contact form submit (success/error) | `status`, `form`, `location` | 12 |
| `schedule_meeting` | Calendly `event_scheduled` | `source` | 12 |
| `language_switch` | Locale toggle | `from`, `to` | 12 |
| `scroll_depth` | 25/50/75/100% reached | `percent`, `path` | 13 |
| `content_engagement` | Time/read milestones on post/case study | `milestone`, `slug` | 13 |
| `select_content` | Related post / content card click | `content_type`, `item_id`, `label` | 13 |
| `search` | Site search performed | `search_term` | 13 |
| `code_copied` | Copy button in code block | `language` | (exists) |
| `toc_navigation` | TOC link click | `heading` | (exists) |

## Adding a tracked element (no client code)

```tsx
import { gaAttrs } from '@/utilities/analytics'

<a href="/contact" {...gaAttrs('cta_click', { label: 'Hablemos', location: 'hero' })}>
  Hablemos
</a>
```

For imperative tracking inside a client component, call `trackEvent` directly:

```tsx
'use client'
import { trackEvent } from '@/utilities/analytics'
// ...
onSuccess={() => trackEvent('generate_lead', { status: 'success', form: 'contact' })}
```
