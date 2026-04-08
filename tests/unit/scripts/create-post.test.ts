/**
 * Tests unitarios para src/scripts/create-post.ts y src/scripts/create-post/llm-adapters.ts
 *
 * Cubre funciones puras exportadas:
 *  - randomStr
 *  - randomPassword
 *  - parseKeywords
 *  - processContent
 *  - assemblePost
 *  - getActiveAccount, registerAccount, incrementPostCount
 *  - createAdapter (errores por API key faltante, providerName)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  randomStr,
  randomPassword,
  parseKeywords,
  processContent,
  assemblePost,
  getActiveAccount,
  registerAccount,
  incrementPostCount,
  CATEGORY_LABELS,
  type DinoRankState,
  type KeywordData,
} from '../../../src/scripts/create-post'
import {
  createAdapter,
  AnthropicAdapter,
  OpenAiAdapter,
  GeminiAdapter,
} from '../../../src/scripts/create-post/llm-adapters'

// ─── Fixture helpers ──────────────────────────────────────────────────────────

const MINIMAL_KEYWORDS_MD = `
| Keyword | Target URL | Volume | Difficulty | Intent | Status | Related Searches | PAA Questions | Competitor Headings | Competitor Meta | Avg. Word Count | Cluster Type |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| guía seo | /seo/guia-seo | 1200 | 45 | Informational | pending | seo técnico | ¿Qué es SEO? | Guía SEO Completa | Meta descripción SEO | 2500 | Pillar |
| technical seo | /tech-seo/technical-seo | 800 | 60 | Informational | pending | core web vitals | ¿Qué es tech seo? | Technical SEO Guide | Meta tech seo | 3000 | Satellite |
`.trim()

// Keywords table with a row missing keyword and one with no targetUrl
const KEYWORDS_WITH_BLANKS = `
| Keyword | Target URL | Volume | Difficulty | Intent | Status | Related Searches | PAA Questions | Competitor Headings | Competitor Meta | Avg. Word Count | Cluster Type |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| guía seo | /seo/guia-seo | 1200 | 45 | Informational | pending | - | - | - | - | 2500 | Pillar |
|  | /seo/sin-keyword | 100 | 10 | - | - | - | - | - | - | - | - |
| sin url |  | 200 | 20 | - | - | - | - | - | - | - | - |
`.trim()

function makeState(overrides: Partial<DinoRankState> = {}): DinoRankState {
  return {
    accounts: [],
    currentAccountIndex: 0,
    ...overrides,
  }
}

// ─── randomStr ────────────────────────────────────────────────────────────────

describe('randomStr', () => {
  it('devuelve string de la longitud correcta', () => {
    expect(randomStr(8)).toHaveLength(8)
    expect(randomStr(16)).toHaveLength(16)
    expect(randomStr(1)).toHaveLength(1)
  })

  it('solo contiene caracteres alfanuméricos en minúsculas', () => {
    const result = randomStr(100)
    expect(result).toMatch(/^[a-z0-9]+$/)
  })

  it('longitud 0 devuelve cadena vacía', () => {
    expect(randomStr(0)).toBe('')
  })

  it('resultados son variados (no siempre iguales)', () => {
    const results = new Set(Array.from({ length: 20 }, () => randomStr(8)))
    expect(results.size).toBeGreaterThan(5)
  })
})

// ─── randomPassword ───────────────────────────────────────────────────────────

describe('randomPassword', () => {
  it('tiene al menos 8 caracteres', () => {
    for (let i = 0; i < 10; i++) {
      expect(randomPassword().length).toBeGreaterThanOrEqual(8)
    }
  })

  it('contiene al menos 1 mayúscula', () => {
    for (let i = 0; i < 20; i++) {
      expect(randomPassword()).toMatch(/[A-Z]/)
    }
  })

  it('contiene al menos 1 dígito', () => {
    for (let i = 0; i < 20; i++) {
      expect(randomPassword()).toMatch(/[0-9]/)
    }
  })

  it('contiene al menos 1 carácter especial', () => {
    for (let i = 0; i < 20; i++) {
      expect(randomPassword()).toMatch(/[!@#$]/)
    }
  })

  it('genera contraseñas distintas en cada llamada', () => {
    const results = new Set(Array.from({ length: 20 }, () => randomPassword()))
    expect(results.size).toBeGreaterThan(5)
  })
})

// ─── parseKeywords ────────────────────────────────────────────────────────────

describe('parseKeywords', () => {
  it('parsea correctamente una tabla mínima', () => {
    // Use a temp dir that definitely doesn't have those files
    const result = parseKeywords(MINIMAL_KEYWORDS_MD, '/tmp/__nonexistent_posts_dir__')
    expect(result).toHaveLength(2)
  })

  it('extrae keyword y targetUrl correctamente', () => {
    const result = parseKeywords(MINIMAL_KEYWORDS_MD, '/tmp/__nonexistent_posts_dir__')
    expect(result[0]?.keyword).toBe('guía seo')
    expect(result[0]?.targetUrl).toBe('/seo/guia-seo')
  })

  it('extrae category y slug del targetUrl', () => {
    const result = parseKeywords(MINIMAL_KEYWORDS_MD, '/tmp/__nonexistent_posts_dir__')
    expect(result[0]?.category).toBe('seo')
    expect(result[0]?.slug).toBe('guia-seo')
    expect(result[1]?.category).toBe('tech-seo')
    expect(result[1]?.slug).toBe('technical-seo')
  })

  it('fileExists es false para slugs inexistentes', () => {
    const result = parseKeywords(MINIMAL_KEYWORDS_MD, '/tmp/__nonexistent_posts_dir__')
    for (const kw of result) {
      expect(kw.fileExists).toBe(false)
    }
  })

  it('ignora filas sin keyword', () => {
    const result = parseKeywords(KEYWORDS_WITH_BLANKS, '/tmp/__nonexistent_posts_dir__')
    const withoutKeyword = result.find((k) => k.keyword === '')
    expect(withoutKeyword).toBeUndefined()
  })

  it('ignora filas sin targetUrl', () => {
    const result = parseKeywords(KEYWORDS_WITH_BLANKS, '/tmp/__nonexistent_posts_dir__')
    const sinUrl = result.find((k) => k.keyword === 'sin url')
    expect(sinUrl).toBeUndefined()
  })

  it('separador :--- no produce filas de datos', () => {
    // The separator row should be skipped entirely
    const result = parseKeywords(MINIMAL_KEYWORDS_MD, '/tmp/__nonexistent_posts_dir__')
    const separatorRow = result.find((k) => k.keyword === ':---' || k.targetUrl === ':---')
    expect(separatorRow).toBeUndefined()
  })

  it('lanza error si no encuentra la tabla', () => {
    expect(() => parseKeywords('sin tabla aquí', '/tmp/__nonexistent_posts_dir__')).toThrow(
      'No se encontró la tabla de keywords',
    )
  })

  it('extrae volumen, dificultad e intent correctamente', () => {
    const result = parseKeywords(MINIMAL_KEYWORDS_MD, '/tmp/__nonexistent_posts_dir__')
    expect(result[0]?.volume).toBe('1200')
    expect(result[0]?.difficulty).toBe('45')
    expect(result[0]?.intent).toBe('Informational')
  })
})

// ─── processContent ───────────────────────────────────────────────────────────

describe('processContent', () => {
  it('extrae el H1 correctamente', () => {
    const raw = '# Mi Título\n\nPárrafo del artículo'
    const { extractedTitle } = processContent(raw)
    expect(extractedTitle).toBe('Mi Título')
  })

  it('el body no contiene el H1', () => {
    const raw = '# Mi Título\n\nPárrafo del artículo'
    const { body } = processContent(raw)
    expect(body).not.toContain('# Mi Título')
    expect(body).toContain('Párrafo del artículo')
  })

  it('elimina líneas vacías iniciales del body', () => {
    const raw = '# Título\n\n\n\nPrimer párrafo'
    const { body } = processContent(raw)
    expect(body.startsWith('Primer párrafo')).toBe(true)
  })

  it('si no hay H1, usa la primera línea no vacía como título', () => {
    const raw = '\nPrimera línea visible\n\nContenido'
    const { extractedTitle, body } = processContent(raw)
    expect(extractedTitle).toBe('Primera línea visible')
    expect(body).toContain('Contenido')
  })

  it('funciona con contenido multilinea con múltiples secciones H2', () => {
    const raw = `# Artículo Completo

## Introducción

Texto introductorio.

## Sección 2

Más contenido aquí.

## FAQ

Preguntas frecuentes.`
    const { extractedTitle, body } = processContent(raw)
    expect(extractedTitle).toBe('Artículo Completo')
    expect(body).toContain('## Introducción')
    expect(body).toContain('## Sección 2')
    expect(body).toContain('## FAQ')
    expect(body).not.toContain('# Artículo Completo')
  })

  it('maneja texto sin ningún heading', () => {
    const raw = 'Solo texto plano\n\nMás texto'
    const { extractedTitle, body } = processContent(raw)
    expect(extractedTitle).toBe('Solo texto plano')
    expect(body).toContain('Más texto')
  })
})

// ─── assemblePost ─────────────────────────────────────────────────────────────

describe('assemblePost', () => {
  const mockKw: KeywordData = {
    keyword: 'guía seo',
    targetUrl: '/seo/guia-seo',
    category: 'seo',
    slug: 'guia-seo',
    volume: '1200',
    difficulty: '45',
    intent: 'Informational',
    status: 'pending',
    relatedSearches: '',
    paaQuestions: '',
    competitorHeadings: '',
    competitorMeta: '',
    avgWordCount: '2500',
    clusterType: 'Pillar',
    filePath: '/content/posts/seo/guia-seo.md',
    fileExists: false,
  }

  const mockAiYaml = `---
title: 'Guía SEO Completa'
tldr: >-
  Aprende SEO desde cero.
metaTitle: 'Guía SEO: todo lo que necesitas saber'
metaDescription: >-
  Descubre cómo optimizar tu web para buscadores con esta guía completa de SEO.
primary_keywords:
  - guía seo
  - seo para principiantes
semantic_keywords:
  - optimización web
  - posicionamiento
contentRole: pillar
pillarSlug: null
relatedPosts:
  - technical-seo
---`

  const mockBody = '## Introducción\n\nTexto del artículo.'

  it('incluye los campos fijos requeridos', () => {
    const result = assemblePost(mockAiYaml, mockKw, mockBody)
    expect(result).toContain('publishedAt:')
    expect(result).toContain('slug: guia-seo')
    expect(result).toContain('idioma: es')
    expect(result).toContain('uploaded: false')
    expect(result).toContain('authors:')
    expect(result).toContain('juan-carlos-angulo')
  })

  it('el body aparece después del bloque ---', () => {
    const result = assemblePost(mockAiYaml, mockKw, mockBody)
    const closingFm = result.lastIndexOf('---')
    const bodyStart = result.indexOf('## Introducción')
    expect(bodyStart).toBeGreaterThan(closingFm)
  })

  it('preserva los campos AI del YAML', () => {
    const result = assemblePost(mockAiYaml, mockKw, mockBody)
    expect(result).toContain("title: 'Guía SEO Completa'")
    expect(result).toContain('contentRole: pillar')
    expect(result).toContain('metaTitle:')
  })

  it('mapea categoryTitle correctamente: seo → SEO', () => {
    const result = assemblePost(mockAiYaml, mockKw, mockBody)
    expect(result).toContain('categoryTitle: SEO')
  })

  it('mapea categoryTitle correctamente: tech-seo → Tech SEO', () => {
    const techKw = { ...mockKw, category: 'tech-seo', slug: 'technical-seo' }
    const result = assemblePost(mockAiYaml, techKw, mockBody)
    expect(result).toContain('categoryTitle: Tech SEO')
  })

  it('el resultado empieza y termina con delimitadores ---', () => {
    const result = assemblePost(mockAiYaml, mockKw, mockBody)
    expect(result.startsWith('---\n')).toBe(true)
  })
})

// ─── State helpers ────────────────────────────────────────────────────────────

describe('getActiveAccount', () => {
  it('devuelve null si no hay cuentas', () => {
    expect(getActiveAccount(makeState())).toBeNull()
  })

  it('devuelve la cuenta activa si postsGenerated < 5', () => {
    const state = makeState({
      accounts: [
        { email: 'a@b.com', password: 'pw', postsGenerated: 2, createdAt: '2026-01-01', lastUsed: '2026-01-01' },
      ],
      currentAccountIndex: 0,
    })
    const acc = getActiveAccount(state)
    expect(acc?.email).toBe('a@b.com')
  })

  it('devuelve null cuando postsGenerated >= 5', () => {
    const state = makeState({
      accounts: [
        { email: 'a@b.com', password: 'pw', postsGenerated: 5, createdAt: '2026-01-01', lastUsed: '2026-01-01' },
      ],
      currentAccountIndex: 0,
    })
    expect(getActiveAccount(state)).toBeNull()
  })

  it('devuelve null cuando el índice apunta a cuenta inexistente', () => {
    const state = makeState({
      accounts: [],
      currentAccountIndex: 99,
    })
    expect(getActiveAccount(state)).toBeNull()
  })
})

describe('registerAccount', () => {
  it('añade la cuenta al array y actualiza el índice', () => {
    const state = makeState()
    registerAccount(state, 'nuevo@test.com', 'pass123')
    expect(state.accounts).toHaveLength(1)
    expect(state.accounts[0]?.email).toBe('nuevo@test.com')
    expect(state.currentAccountIndex).toBe(0)
  })

  it('el índice apunta a la nueva cuenta tras dos registros', () => {
    const state = makeState()
    registerAccount(state, 'primero@test.com', 'pass1')
    registerAccount(state, 'segundo@test.com', 'pass2')
    expect(state.currentAccountIndex).toBe(1)
    expect(state.accounts[1]?.email).toBe('segundo@test.com')
  })

  it('la nueva cuenta tiene postsGenerated = 0', () => {
    const state = makeState()
    registerAccount(state, 'test@test.com', 'pw')
    expect(state.accounts[0]?.postsGenerated).toBe(0)
  })
})

describe('incrementPostCount', () => {
  it('incrementa postsGenerated en la cuenta activa', () => {
    const state = makeState({
      accounts: [
        { email: 'a@b.com', password: 'pw', postsGenerated: 1, createdAt: '2026-01-01', lastUsed: '2026-01-01' },
      ],
      currentAccountIndex: 0,
    })
    incrementPostCount(state)
    expect(state.accounts[0]?.postsGenerated).toBe(2)
  })

  it('actualiza lastUsed', () => {
    const state = makeState({
      accounts: [
        { email: 'a@b.com', password: 'pw', postsGenerated: 0, createdAt: '2020-01-01', lastUsed: '2020-01-01' },
      ],
      currentAccountIndex: 0,
    })
    incrementPostCount(state)
    expect(state.accounts[0]?.lastUsed).not.toBe('2020-01-01')
  })

  it('no lanza si no hay cuentas', () => {
    const state = makeState()
    expect(() => incrementPostCount(state)).not.toThrow()
  })
})

// ─── CATEGORY_LABELS ──────────────────────────────────────────────────────────

describe('CATEGORY_LABELS', () => {
  it('tiene las categorías esperadas', () => {
    expect(CATEGORY_LABELS['seo']).toBe('SEO')
    expect(CATEGORY_LABELS['tech-seo']).toBe('Tech SEO')
    expect(CATEGORY_LABELS['development']).toBe('Development')
    expect(CATEGORY_LABELS['cs-fundamentals']).toBe('CS Fundamentals')
  })
})

// ─── createAdapter ────────────────────────────────────────────────────────────

describe('createAdapter', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.OPENAI_API_KEY
    delete process.env.GOOGLE_AI_API_KEY
  })

  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = originalEnv.ANTHROPIC_API_KEY
    process.env.OPENAI_API_KEY = originalEnv.OPENAI_API_KEY
    process.env.GOOGLE_AI_API_KEY = originalEnv.GOOGLE_AI_API_KEY
  })

  it("lanza error si falta ANTHROPIC_API_KEY", () => {
    expect(() => createAdapter('anthropic')).toThrow('ANTHROPIC_API_KEY')
  })

  it("lanza error si falta OPENAI_API_KEY", () => {
    expect(() => createAdapter('openai')).toThrow('OPENAI_API_KEY')
  })

  it("lanza error si falta GOOGLE_AI_API_KEY", () => {
    expect(() => createAdapter('gemini')).toThrow('GOOGLE_AI_API_KEY')
  })

  it('crea AnthropicAdapter cuando hay ANTHROPIC_API_KEY', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test'
    const adapter = createAdapter('anthropic')
    expect(adapter).toBeInstanceOf(AnthropicAdapter)
    expect(adapter.providerName).toBe('anthropic')
  })

  it('crea OpenAiAdapter cuando hay OPENAI_API_KEY', () => {
    process.env.OPENAI_API_KEY = 'sk-openai-test'
    const adapter = createAdapter('openai')
    expect(adapter).toBeInstanceOf(OpenAiAdapter)
    expect(adapter.providerName).toBe('openai')
  })

  it('crea GeminiAdapter cuando hay GOOGLE_AI_API_KEY', () => {
    process.env.GOOGLE_AI_API_KEY = 'AI-test'
    const adapter = createAdapter('gemini')
    expect(adapter).toBeInstanceOf(GeminiAdapter)
    expect(adapter.providerName).toBe('gemini')
  })

  it('los adapters tienen la propiedad providerName correcta', () => {
    expect(new AnthropicAdapter('key').providerName).toBe('anthropic')
    expect(new OpenAiAdapter('key').providerName).toBe('openai')
    expect(new GeminiAdapter('key').providerName).toBe('gemini')
  })
})
