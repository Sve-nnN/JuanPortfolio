import { describe, it, expect } from 'vitest'
import { auditDoc, type AuditDocArgs } from './keywordCoverageAudit'

/** Minimal Lexical-ish node builders so the analyzer sees real headings/paras. */
const heading = (tag: string, text: string) => ({
  type: 'heading',
  tag,
  children: [{ text }],
})
const paragraph = (text: string) => ({
  type: 'paragraph',
  children: [{ text }],
})
const root = (...children: unknown[]) => ({ root: { children } })

const base: Omit<AuditDocArgs, 'keyword'> = {
  collection: 'posts',
  id: '1',
  label: 'Test',
  isListing: false,
  locale: 'en',
}

describe('auditDoc — bucketing + N/A handling', () => {
  it('1. no keyword → bucket noKeyword, no checks run', () => {
    const row = auditDoc({ ...base, keyword: null })
    expect(row.bucket).toBe('noKeyword')
    expect(row.keyword).toBeNull()
    expect(row.failingChecks).toEqual([])
    expect(row.amberChecks).toEqual([])
    expect(row.naChecks).toEqual([])
    expect(row.score).toBeUndefined()
  })

  it('2. post with keyword absent from fields → bucket failing, title is red', () => {
    const row = auditDoc({
      ...base,
      keyword: 'core web vitals',
      title: 'A totally unrelated headline',
      meta: { description: 'Nothing matching here.' },
      slug: 'unrelated-headline',
      content: root(paragraph('Some body text with no target phrase at all.')),
    })
    expect(row.bucket).toBe('failing')
    expect(row.failingChecks).toContain('title')
    // Content checks are applicable (not a listing), so they participate too.
    expect(row.naChecks).toEqual([])
  })

  it('3. fully optimized post → bucket passing, no failing checks', () => {
    const row = auditDoc({
      ...base,
      keyword: 'core web vitals',
      title: 'Core web vitals optimization guide',
      meta: { description: 'A practical guide to core web vitals for faster pages.' },
      slug: 'core-web-vitals-guide',
      content: root(
        heading('h1', 'Core web vitals guide'),
        paragraph(
          'Core web vitals are the metrics Google uses to measure real user experience, and they directly affect how your pages rank in search results today.',
        ),
        heading('h2', 'Improving core web vitals'),
        paragraph(
          'Teams that monitor performance closely can reduce layout shift, speed up loading, and improve interactivity over time, which keeps visitors engaged and lowers the rate at which people abandon a slow page before it finishes rendering for them properly.',
        ),
      ),
    })
    expect(row.bucket).toBe('passing')
    expect(row.failingChecks).toEqual([])
    expect(row.score).toBeGreaterThan(0)
  })

  it('4. category listing → content + meta checks are N/A, not failing', () => {
    const row = auditDoc({
      ...base,
      collection: 'categories',
      isListing: true,
      keyword: 'core web vitals',
      title: 'Core web vitals',
      slug: 'core-web-vitals',
      // meta undefined, content undefined → those checks resolve to N/A.
    })
    expect(row.bucket).toBe('passing')
    expect(row.failingChecks).toEqual([])
    expect(row.naChecks).toEqual(
      expect.arrayContaining(['h1', 'density', 'firstParagraph', 'subheadings', 'metaDescription']),
    )
    // N/A checks must never appear in failingChecks even with no body.
    for (const id of ['h1', 'density', 'firstParagraph', 'subheadings', 'metaDescription'] as const) {
      expect(row.failingChecks).not.toContain(id)
    }
  })

  it('5. user listing → slug and metaDescription are N/A', () => {
    const row = auditDoc({
      ...base,
      collection: 'users',
      isListing: true,
      keyword: 'core web vitals',
      title: 'Core web vitals', // user name used as the title source
      // slug + meta undefined.
    })
    expect(row.naChecks).toContain('slug')
    expect(row.naChecks).toContain('metaDescription')
  })

  it('7. WR-04: dangling relation (unresolved) → bucket unresolvedKeyword, not noKeyword', () => {
    const row = auditDoc({ ...base, keyword: null, unresolved: true })
    expect(row.bucket).toBe('unresolvedKeyword')
    expect(row.keyword).toBeNull()
    expect(row.failingChecks).toEqual([])
    expect(row.score).toBeUndefined()
  })

  it('6. listing failing only on title → N/A content checks never flip the bucket', () => {
    const row = auditDoc({
      ...base,
      collection: 'categories',
      isListing: true,
      keyword: 'core web vitals',
      title: 'Unrelated title', // red
      slug: 'core-web-vitals', // green
      // meta + content undefined → N/A.
    })
    expect(row.bucket).toBe('failing')
    expect(row.failingChecks).toEqual(['title'])
  })

  // Plan 24-01: primaryKeyword is now `localized: true`, so querying the audit
  // per locale resolves a different keyword per locale. A document that targets
  // a keyword in `es` but has none assigned in `en` must surface as a coverage
  // gap in the `en` audit while passing in the `es` audit. We model the two
  // per-locale passes the orchestrator performs (payload.find({locale}) →
  // auditDoc({locale})) as two pure auditDoc calls for the same document id.
  it('8. locale divergence: keyword in es but not en → gap in en, passing in es', () => {
    // EN pass: the localized relation resolves to null (no en keyword set).
    const enRow = auditDoc({
      ...base,
      id: '42',
      locale: 'en',
      keyword: null,
    })
    expect(enRow.bucket).toBe('noKeyword')
    expect(enRow.keyword).toBeNull()
    expect(enRow.failingChecks).toEqual([])
    expect(enRow.score).toBeUndefined()

    // ES pass: same document, the localized relation resolves to the es keyword
    // with fully optimized es fields → passing, not a gap.
    const esRow = auditDoc({
      ...base,
      id: '42',
      locale: 'es',
      keyword: 'núcleos vitales web',
      title: 'Guía de núcleos vitales web para optimizar',
      meta: {
        description:
          'Una guía práctica sobre núcleos vitales web para acelerar tus páginas y mejorar la experiencia.',
      },
      slug: 'nucleos-vitales-web-guia',
      content: root(
        heading('h1', 'Guía de núcleos vitales web'),
        paragraph(
          'Los núcleos vitales web son las métricas que Google usa para medir la experiencia real del usuario, y afectan directamente cómo posicionan tus páginas en los resultados de búsqueda hoy.',
        ),
        heading('h2', 'Cómo mejorar los núcleos vitales web'),
        paragraph(
          'Los equipos que monitorean el rendimiento de cerca pueden reducir el desplazamiento de diseño, acelerar la carga y mejorar la interactividad con el tiempo, lo que mantiene a los visitantes interesados y baja la tasa con la que las personas abandonan una página lenta antes de que termine de renderizar correctamente para ellos.',
        ),
      ),
    })
    expect(esRow.bucket).toBe('passing')
    expect(esRow.keyword).toBe('núcleos vitales web')
    expect(esRow.failingChecks).toEqual([])
    expect(esRow.score).toBeGreaterThan(0)

    // The same document id diverges by locale: gap in en, covered in es.
    expect(enRow.bucket).not.toBe(esRow.bucket)
  })
})
