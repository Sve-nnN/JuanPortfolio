---
phase: 03-schema-audit
plan: 02
subsystem: schema
tags: [schema-org, person, professional-service, homepage, structured-data]
key-files:
  modified:
    - src/components/JsonLd.tsx
decisions:
  - Person schema hardcoded in JsonLd.tsx (not pulled from CMS) — persona data is stable, avoids Payload query on homepage
  - ProfessionalService built inline (not a separate utility) — one-off schema, no reuse elsewhere
  - homeSchemas uses IIFE pattern to keep logic scoped and avoid polluting component namespace
metrics:
  duration: "~5min"
  completed: "2026-03-31"
  tasks: 1
  files: 1
---

# Phase 3 Plan 2: Person + ProfessionalService on Homepage Summary

One-liner: Added Person schema (sameAs LinkedIn+GitHub, knowsAbout 6 topics) and ProfessionalService schema to homepage @graph via JsonLd.tsx isHome branch.

## Changes Made to JsonLd.tsx

1. **Import added (line 5):** `import { generatePersonSchema } from '@/utilities/schema'`

2. **homeSchemas block added (after expertFaq, before schemas array):** When `isHome=true`, calls `generatePersonSchema()` with:
   - `name: 'Juan Carlos Angulo'`
   - `url: ${siteUrl}/authors/juan-carlos-angulo` (locale-aware)
   - `jobTitle: 'Technical SEO Engineer & Full-Stack Developer'`
   - `sameAs: ['https://www.linkedin.com/in/juancangulo/', 'https://github.com/sve-nnn']`
   - `knowsAbout: ['Technical SEO', 'Next.js', 'TypeScript', 'Payload CMS', 'Web Performance', 'Content Strategy']`

3. **ProfessionalService built inline:**
   - `@type: ProfessionalService`
   - `@id: ${siteUrl}/#service`
   - `provider: { '@id': '${siteUrl}/#person' }` — links to Person via @id reference
   - `areaServed: 'Worldwide'`
   - `serviceType: ['Technical SEO', 'Web Development', 'Content Strategy']`
   - Bilingual description (es/en based on `locale` prop)

4. **schemas.push(...homeSchemas)** added after FAQ push — both schemas join the @graph.

## Schema Fields Added

### Person schema
- `@id`: `https://juan-tech.com/#person`
- `name`: "Juan Carlos Angulo"
- `jobTitle`: "Technical SEO Engineer & Full-Stack Developer"
- `sameAs`: LinkedIn + GitHub URLs
- `knowsAbout`: 6 topics (Technical SEO, Next.js, TypeScript, Payload CMS, Web Performance, Content Strategy)

### ProfessionalService schema
- `@id`: `https://juan-tech.com/#service`
- `provider`: `{ '@id': '/#person' }`
- `areaServed`: Worldwide
- `serviceType`: 3 service categories

## TypeScript Issues

None. `siteUrl` and `locale` already available as props. `Schema` type is `Record<string, any>` — ProfessionalService assignable without cast.

## Deviations from Plan

None — plan executed exactly as written.
