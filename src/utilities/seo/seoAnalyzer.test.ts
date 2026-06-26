import { describe, it, expect } from 'vitest'
import {
  analyzeKeywordChecks,
  extractText,
  extractHeadings,
} from './seoAnalyzer'
import { scoreToColor, CHECK_ORDER } from './keywordScore'
import type { KeywordCheckId, KeywordScoreResult } from './keywordScore'

// ---------------------------------------------------------------------------
// Lexical fixture helpers
// ---------------------------------------------------------------------------
function textNode(text: string) {
  return { type: 'text', text, version: 1 }
}
function paragraph(text: string) {
  return { type: 'paragraph', version: 1, children: [textNode(text)] }
}
function heading(tag: string, text: string) {
  return { type: 'heading', tag, version: 1, children: [textNode(text)] }
}
function richText(children: unknown[]) {
  return { root: { type: 'root', version: 1, children } }
}
function filler(n: number): string {
  return Array(n).fill('palabra').join(' ')
}

function check(result: KeywordScoreResult, id: KeywordCheckId) {
  const c = result.checks.find((x) => x.id === id)
  if (!c) throw new Error(`check ${id} not found`)
  return c
}

// Base "everything green" input (en locale).
function greenAllInput() {
  return {
    keyword: 'keyword test',
    title: 'Keyword Test Guide',
    meta: {
      title: 'Keyword Test Guide',
      description: 'A keyword test description that is helpful',
    },
    slug: 'keyword-test-guide',
    locale: 'en' as const,
    content: richText([
      heading('h1', 'Keyword Test Heading'),
      paragraph('Keyword test ' + filler(60)),
      heading('h2', 'Keyword Test Section'),
      paragraph(filler(80)),
    ]),
  }
}

describe('scoreToColor (locked thresholds)', () => {
  it('maps boundary scores correctly', () => {
    expect(scoreToColor(49)).toBe('red')
    expect(scoreToColor(50)).toBe('amber')
    expect(scoreToColor(79)).toBe('amber')
    expect(scoreToColor(80)).toBe('green')
    expect(scoreToColor(0)).toBe('red')
    expect(scoreToColor(100)).toBe('green')
  })
})

describe('analyzeKeywordChecks - structure', () => {
  it('returns the 7 checks in fixed order', async () => {
    const r = await analyzeKeywordChecks(greenAllInput())
    expect(r.checks.map((c) => c.id)).toEqual(CHECK_ORDER)
    expect(r.checks).toHaveLength(7)
  })

  it('each check carries a bilingual label', async () => {
    const r = await analyzeKeywordChecks(greenAllInput())
    for (const c of r.checks) {
      expect(typeof c.label.es).toBe('string')
      expect(typeof c.label.en).toBe('string')
      expect(c.label.es.length).toBeGreaterThan(0)
      expect(c.label.en.length).toBeGreaterThan(0)
    }
  })
})

describe('analyzeKeywordChecks - green on all', () => {
  it('scores 100 / green when every check passes', async () => {
    const r = await analyzeKeywordChecks(greenAllInput())
    for (const c of r.checks) {
      expect(c.state, `check ${c.id} should be green`).toBe('green')
      expect(c.feedback).toBeUndefined()
    }
    expect(r.score).toBe(100)
    expect(r.scoreColor).toBe('green')
    expect(r.passCount).toBe(7)
  })
})

describe('analyzeKeywordChecks - per check red/amber', () => {
  it('title red when keyword missing from meta.title', async () => {
    const input = greenAllInput()
    input.meta.title = 'A Completely Different Heading'
    input.title = 'A Completely Different Heading'
    const r = await analyzeKeywordChecks(input)
    expect(check(r, 'title').state).toBe('red')
    expect(check(r, 'title').feedback?.es).toBeTruthy()
    expect(check(r, 'title').feedback?.en).toBeTruthy()
  })

  it('metaDescription red when keyword missing', async () => {
    const input = greenAllInput()
    input.meta.description = 'Nothing relevant in this sentence at all'
    const r = await analyzeKeywordChecks(input)
    expect(check(r, 'metaDescription').state).toBe('red')
  })

  it('h1 red when keyword missing from H1', async () => {
    const input = greenAllInput()
    input.title = 'Unrelated Doc Title'
    input.content = richText([
      heading('h1', 'Some Unrelated Heading'),
      paragraph('Keyword test ' + filler(60)),
      heading('h2', 'Keyword Test Section'),
    ])
    const r = await analyzeKeywordChecks(input)
    expect(check(r, 'h1').state).toBe('red')
  })

  it('slug red when keyword missing', async () => {
    const input = greenAllInput()
    input.slug = 'some-other-url'
    const r = await analyzeKeywordChecks(input)
    expect(check(r, 'slug').state).toBe('red')
  })

  it('density red when keyword absent from body', async () => {
    const input = greenAllInput()
    input.content = richText([paragraph(filler(200))])
    const r = await analyzeKeywordChecks(input)
    expect(check(r, 'density').state).toBe('red')
  })

  it('density amber when present but density too high', async () => {
    const input = greenAllInput()
    input.content = richText([paragraph('keyword test keyword test keyword test')])
    const r = await analyzeKeywordChecks(input)
    expect(check(r, 'density').state).toBe('amber')
    expect(check(r, 'density').feedback?.es).toContain('%')
  })

  it('density amber when present but density too low', async () => {
    const input = greenAllInput()
    input.content = richText([paragraph('keyword test ' + filler(800))])
    const r = await analyzeKeywordChecks(input)
    expect(check(r, 'density').state).toBe('amber')
  })

  it('firstParagraph amber when keyword appears late', async () => {
    const input = greenAllInput()
    input.content = richText([
      heading('h1', 'Keyword Test Heading'),
      paragraph(filler(40) + ' keyword test'),
      heading('h2', 'Keyword Test Section'),
    ])
    const r = await analyzeKeywordChecks(input)
    expect(check(r, 'firstParagraph').state).toBe('amber')
  })

  it('firstParagraph red when keyword absent from first paragraph', async () => {
    const input = greenAllInput()
    input.content = richText([
      heading('h1', 'Keyword Test Heading'),
      paragraph(filler(40)),
      heading('h2', 'Keyword Test Section'),
      paragraph('keyword test ' + filler(20)),
    ])
    const r = await analyzeKeywordChecks(input)
    expect(check(r, 'firstParagraph').state).toBe('red')
  })

  it('subheadings red when no subheading contains keyword', async () => {
    const input = greenAllInput()
    input.content = richText([
      heading('h1', 'Keyword Test Heading'),
      paragraph('Keyword test ' + filler(60)),
      heading('h2', 'A Plain Section'),
      heading('h3', 'Another Plain Section'),
    ])
    const r = await analyzeKeywordChecks(input)
    expect(check(r, 'subheadings').state).toBe('red')
  })

  it('subheadings amber when keyword only in few of several', async () => {
    const input = greenAllInput()
    input.content = richText([
      heading('h1', 'Keyword Test Heading'),
      paragraph('Keyword test ' + filler(60)),
      heading('h2', 'Keyword Test Section'),
      heading('h2', 'Plain Section Two'),
      heading('h2', 'Plain Section Three'),
      heading('h2', 'Plain Section Four'),
    ])
    const r = await analyzeKeywordChecks(input)
    expect(check(r, 'subheadings').state).toBe('amber')
  })
})

describe('analyzeKeywordChecks - es/en stemming', () => {
  it('es: "optimización seo" matches body "optimizar seo"', async () => {
    const r = await analyzeKeywordChecks({
      keyword: 'optimización seo',
      locale: 'es',
      meta: { title: 'Guía de optimizar seo', description: 'optimizar seo aquí' },
      slug: 'optimizar-seo',
      content: richText([
        heading('h1', 'optimizar seo en la web'),
        paragraph('Hablamos de optimizar seo ' + filler(40)),
        heading('h2', 'optimizar seo avanzado'),
      ]),
    })
    expect(check(r, 'title').state).toBe('green')
    expect(check(r, 'metaDescription').state).toBe('green')
    expect(check(r, 'h1').state).toBe('green')
    expect(check(r, 'slug').state).toBe('green')
    expect(check(r, 'firstParagraph').state).toBe('green')
  })

  it('en: "running shoes" matches body "run shoe"', async () => {
    const r = await analyzeKeywordChecks({
      keyword: 'running shoes',
      locale: 'en',
      meta: { title: 'Best run shoe review', description: 'a run shoe guide' },
      slug: 'run-shoe-review',
      content: richText([
        heading('h1', 'The run shoe roundup'),
        paragraph('We test every run shoe ' + filler(40)),
        heading('h2', 'run shoe picks'),
      ]),
    })
    expect(check(r, 'title').state).toBe('green')
    expect(check(r, 'h1').state).toBe('green')
    expect(check(r, 'slug').state).toBe('green')
  })
})

describe('extractors - Pages blocks (layout array)', () => {
  const pagesContent = {
    layout: [
      {
        blockType: 'content',
        id: 'a',
        richText: richText([
          heading('h1', 'Pages keyword here'),
          paragraph('keyword inside a page block paragraph with extra words'),
        ]),
      },
      {
        blockType: 'section',
        id: 'b',
        columns: [
          {
            richText: richText([
              heading('h2', 'Subheading keyword section'),
              paragraph('more page body content here'),
            ]),
          },
        ],
      },
    ],
  }

  it('extractText pulls text out of blocks array', () => {
    const t = extractText(pagesContent)
    expect(t).toContain('keyword inside a page block paragraph')
    expect(t).toContain('more page body content here')
    // must not leak structural strings
    expect(t).not.toContain('blockType')
  })

  it('extractHeadings counts headings inside blocks', () => {
    const h = extractHeadings(pagesContent)
    expect(h.h1).toBe(1)
    expect(h.h2).toBe(1)
  })

  it('analyzeKeywordChecks works against Pages blocks shape', async () => {
    const r = await analyzeKeywordChecks({
      keyword: 'keyword',
      locale: 'en',
      meta: { title: 'Pages keyword title', description: 'keyword desc' },
      slug: 'pages-keyword',
      content: pagesContent,
    })
    expect(check(r, 'h1').state).toBe('green')
    expect(check(r, 'subheadings').state).toBe('green')
    expect(check(r, 'firstParagraph').state).toBe('green')
  })
})

describe('weighted score', () => {
  it('all red yields 0 / red', async () => {
    const r = await analyzeKeywordChecks({
      keyword: 'absent phrase',
      locale: 'en',
      meta: { title: 'nothing here', description: 'still nothing' },
      slug: 'unrelated',
      content: richText([heading('h1', 'plain heading'), paragraph(filler(100))]),
    })
    expect(r.score).toBe(0)
    expect(r.scoreColor).toBe('red')
    expect(r.passCount).toBe(0)
  })

  it('amber earns half the check weight', async () => {
    // Only density amber (weight 15 -> 7.5 -> round 8), everything else red.
    const input = {
      keyword: 'absent phrase',
      locale: 'en' as const,
      meta: { title: 'nothing here', description: 'still nothing' },
      slug: 'unrelated',
      // keyword absent everywhere except density: craft body so only density check fires amber
      content: richText([
        heading('h1', 'plain heading'),
        // first paragraph has no keyword (red), but body high density makes density amber
        paragraph('plain intro ' + filler(20)),
        paragraph('absent phrase absent phrase absent phrase'),
      ]),
    }
    const r = await analyzeKeywordChecks(input)
    expect(check(r, 'density').state).toBe('amber')
    // density weight 15 * 0.5 = 7.5 -> rounds to 8
    expect(r.score).toBe(8)
  })
})

describe('consistent phrase matching (M1-02)', () => {
  it('title red when keyword tokens are present but not contiguous', async () => {
    const input = greenAllInput()
    // Contains "test" and "keyword" but never the contiguous phrase "keyword test".
    input.meta.title = 'Test guide about a keyword'
    input.title = 'Test guide about a keyword'
    const r = await analyzeKeywordChecks(input)
    expect(check(r, 'title').state).toBe('red')
  })

  it('multi-word keyword matches only as a contiguous phrase in the body', async () => {
    const input = {
      keyword: 'core web vitals',
      locale: 'en' as const,
      meta: { title: 'core web vitals guide', description: 'core web vitals tips' },
      slug: 'core-web-vitals',
      content: richText([
        heading('h1', 'core web vitals explained'),
        // tokens present but scattered, never contiguous
        paragraph('the core of the web is about vitals ' + filler(60)),
        heading('h2', 'core web vitals tips'),
      ]),
    }
    const r = await analyzeKeywordChecks(input)
    expect(check(r, 'firstParagraph').state).toBe('red')
    expect(check(r, 'density').state).toBe('red')
  })
})

describe('H1 fallback removed (M3-04)', () => {
  it('h1 red when the content has no H1 node even if title has the keyword', async () => {
    const input = greenAllInput()
    input.content = richText([
      paragraph('Keyword test ' + filler(60)),
      heading('h2', 'Keyword Test Section'),
    ])
    const r = await analyzeKeywordChecks(input)
    expect(check(r, 'h1').state).toBe('red')
    expect(check(r, 'h1').feedback?.es).toBeTruthy()
    expect(check(r, 'h1').feedback?.en).toBeTruthy()
  })
})

describe('density denominator excludes headings (L3-08)', () => {
  it('keyword only in a heading does not register as a body occurrence', async () => {
    const input = {
      keyword: 'keyword test',
      locale: 'en' as const,
      meta: { title: 'x', description: 'x' },
      slug: 'x',
      content: richText([
        heading('h1', 'keyword test heading'),
        paragraph(filler(100)),
      ]),
    }
    const r = await analyzeKeywordChecks(input)
    expect(check(r, 'density').state).toBe('red')
  })
})

describe('analyzeSEO regression (extractors still work internally)', () => {
  it('extractText handles a simple Posts richText', () => {
    const c = richText([paragraph('hello world from posts')])
    expect(extractText(c)).toBe('hello world from posts')
  })
})
