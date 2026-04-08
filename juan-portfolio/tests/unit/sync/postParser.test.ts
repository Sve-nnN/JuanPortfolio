/**
 * Tests unitarios para src/scripts/sync/postParser.ts
 *
 * Cubre:
 *  - parsePostFile: extracción de frontmatter, detección de locale, slug
 *  - validatePost: detección de campos requeridos faltantes
 *  - buildPostData: construcción del payload para Payload CMS
 */

import { describe, it, expect, vi } from 'vitest'
import { parsePostFile, validatePost, buildPostData } from '../../../src/scripts/sync/postParser'
import type { ResolvedIds } from '../../../src/scripts/sync/types'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const NOINDEX_FRONTMATTER = `---
title: "Post con noindex"
slug: post-con-noindex
noindex: true
---
Contenido del post.
`

const VALID_FRONTMATTER = `---
title: "Guía de SEO Técnico"
slug: guia-seo-tecnico
publishedAt: "2025-01-15T00:00:00Z"
primary_keywords:
  - seo técnico
semantic_keywords:
  - optimización de sitios
  - core web vitals
metaTitle: "Guía completa de SEO Técnico"
metaDescription: "Aprende SEO técnico desde cero"
tldr: "Resumen de la guía de SEO técnico"
---
# Guía de SEO Técnico

Contenido del artículo aquí.
`

const MINIMAL_FRONTMATTER = `---
title: "Artículo Mínimo"
---
Contenido mínimo.
`

const NO_TITLE_FRONTMATTER = `---
slug: sin-titulo
published: true
---
Contenido sin título.
`

const EN_FRONTMATTER = `---
title: "Technical SEO Guide"
slug: technical-seo-guide
idioma: en
---
Content here.
`

const RESOLVED_IDS: ResolvedIds = {
  primaryKeywordId: 'kw-id-123',
  semanticKeywordIds: ['sem-id-1', 'sem-id-2'],
  authorIds: ['author-id-1'],
  categoryIds: ['cat-id-1'],
}

// ─── parsePostFile ────────────────────────────────────────────────────────────

describe('parsePostFile', () => {
  it('extrae título del frontmatter', () => {
    const result = parsePostFile('content/posts/article.md', VALID_FRONTMATTER)
    expect(result.title).toBe('Guía de SEO Técnico')
  })

  it('extrae slug del frontmatter', () => {
    const result = parsePostFile('content/posts/article.md', VALID_FRONTMATTER)
    expect(result.slug).toBe('guia-seo-tecnico')
  })

  it('extrae el cuerpo del artículo (sin el frontmatter)', () => {
    const result = parsePostFile('content/posts/article.md', VALID_FRONTMATTER)
    expect(result.body).toContain('# Guía de SEO Técnico')
    expect(result.body).toContain('Contenido del artículo aquí.')
    // El cuerpo no debe incluir el delimitador ---
    expect(result.body).not.toContain('title:')
  })

  it('extrae tldr del frontmatter', () => {
    const result = parsePostFile('content/posts/article.md', VALID_FRONTMATTER)
    expect(result.tldr).toBe('Resumen de la guía de SEO técnico')
  })

  it('detecta locale "es" desde suffix .es.md', () => {
    const result = parsePostFile('content/posts/guia-seo.es.md', VALID_FRONTMATTER)
    expect(result.locale).toBe('es')
  })

  it('detecta locale "en" desde suffix .en.md (prioridad sobre frontmatter)', () => {
    const result = parsePostFile('content/posts/guide.en.md', EN_FRONTMATTER)
    expect(result.locale).toBe('en')
  })

  it('detecta locale "en" desde frontmatter idioma cuando no hay suffix', () => {
    const result = parsePostFile('content/posts/guide.md', EN_FRONTMATTER)
    expect(result.locale).toBe('en')
  })

  it('usa default "es" cuando no hay suffix ni frontmatter idioma', () => {
    const result = parsePostFile('content/posts/article.md', MINIMAL_FRONTMATTER)
    expect(result.locale).toBe('es')
  })

  it('genera slug desde el nombre del archivo cuando no hay slug en frontmatter', () => {
    const result = parsePostFile('content/posts/mi-articulo.md', MINIMAL_FRONTMATTER)
    expect(result.slug).toBe('mi-articulo')
  })

  it('usa slug del frontmatter cuando está disponible', () => {
    const result = parsePostFile('content/posts/otro-nombre.md', VALID_FRONTMATTER)
    expect(result.slug).toBe('guia-seo-tecnico')
  })

  it('genera slug sin locale suffix para archivo .en.md', () => {
    const result = parsePostFile('content/posts/technical-seo.en.md', MINIMAL_FRONTMATTER)
    expect(result.slug).toBe('technical-seo') // sin '.en'
  })

  it('preserva el frontmatter completo en result.frontmatter', () => {
    const result = parsePostFile('content/posts/article.md', VALID_FRONTMATTER)
    expect(result.frontmatter.primary_keywords).toContain('seo técnico')
    expect(result.frontmatter.metaTitle).toBe('Guía completa de SEO Técnico')
    expect(result.frontmatter.publishedAt).toBe('2025-01-15T00:00:00Z')
  })

  it('maneja frontmatter sin campos opcionales (tldr vacío)', () => {
    const result = parsePostFile('content/posts/min.md', MINIMAL_FRONTMATTER)
    expect(result.tldr).toBe('')
    expect(result.title).toBe('Artículo Mínimo')
  })

  it('frontmatter con noindex: true retorna frontmatter.noindex === true', () => {
    const result = parsePostFile('content/posts/article.md', NOINDEX_FRONTMATTER)
    expect(result.frontmatter.noindex).toBe(true)
  })

  it('frontmatter sin noindex retorna frontmatter.noindex === undefined', () => {
    const result = parsePostFile('content/posts/article.md', VALID_FRONTMATTER)
    expect(result.frontmatter.noindex).toBeUndefined()
  })
})

// ─── validatePost ─────────────────────────────────────────────────────────────

describe('validatePost', () => {
  it('retorna array vacío para un post válido', () => {
    const post = parsePostFile('content/posts/article.md', VALID_FRONTMATTER)
    const errors = validatePost(post)
    expect(errors).toHaveLength(0)
  })

  it('reporta error cuando falta el título', () => {
    const post = parsePostFile('content/posts/article.md', NO_TITLE_FRONTMATTER)
    const errors = validatePost(post)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('title')
  })

  it('reporta error de "title" cuando el título es una cadena vacía', () => {
    const post = parsePostFile('content/posts/article.md', `---\ntitle: ""\n---\nContent`)
    const errors = validatePost(post)
    expect(errors.some((e) => e.toLowerCase().includes('title'))).toBe(true)
  })

  it('post mínimo válido (solo título) no tiene errores', () => {
    const post = parsePostFile('content/posts/min.md', MINIMAL_FRONTMATTER)
    const errors = validatePost(post)
    expect(errors).toHaveLength(0)
  })

  it('retorna un array (nunca null/undefined)', () => {
    const post = parsePostFile('content/posts/article.md', VALID_FRONTMATTER)
    const result = validatePost(post)
    expect(Array.isArray(result)).toBe(true)
  })
})

// ─── buildPostData ────────────────────────────────────────────────────────────

describe('buildPostData', () => {
  it('construye el payload con título y slug correctos', () => {
    const post = parsePostFile('content/posts/article.md', VALID_FRONTMATTER)
    const data = buildPostData(post, RESOLVED_IDS)
    expect(data.title).toBe('Guía de SEO Técnico')
    expect(data.slug).toBe('guia-seo-tecnico')
  })

  it('asigna primaryKeyword desde resolvedIds', () => {
    const post = parsePostFile('content/posts/article.md', VALID_FRONTMATTER)
    const data = buildPostData(post, RESOLVED_IDS)
    expect(data.primaryKeyword).toBe('kw-id-123')
  })

  it('asigna semanticKeywords desde resolvedIds', () => {
    const post = parsePostFile('content/posts/article.md', VALID_FRONTMATTER)
    const data = buildPostData(post, RESOLVED_IDS)
    expect(data.semanticKeywords).toEqual(['sem-id-1', 'sem-id-2'])
  })

  it('asigna authors y categories desde resolvedIds', () => {
    const post = parsePostFile('content/posts/article.md', VALID_FRONTMATTER)
    const data = buildPostData(post, RESOLVED_IDS)
    expect(data.authors).toEqual(['author-id-1'])
    expect(data.categories).toEqual(['cat-id-1'])
  })

  it('el status es "published" cuando uploaded no es false', () => {
    const post = parsePostFile('content/posts/article.md', VALID_FRONTMATTER)
    const data = buildPostData(post, RESOLVED_IDS)
    expect(data._status).toBe('published')
  })

  it('el status es "draft" cuando uploaded === false', () => {
    const draftFrontmatter = VALID_FRONTMATTER.replace('---\n', '---\nuploaded: false\n')
    const post = parsePostFile('content/posts/article.md', draftFrontmatter)
    const data = buildPostData(post, RESOLVED_IDS)
    expect(data._status).toBe('draft')
  })

  it('respeta el campo "status" explícito del frontmatter', () => {
    const withStatus = VALID_FRONTMATTER.replace('---\n', '---\nstatus: draft\n')
    const post = parsePostFile('content/posts/article.md', withStatus)
    const data = buildPostData(post, RESOLVED_IDS)
    expect(data._status).toBe('draft')
  })

  it('popula meta.title y meta.description desde frontmatter', () => {
    const post = parsePostFile('content/posts/article.md', VALID_FRONTMATTER)
    const data = buildPostData(post, RESOLVED_IDS)
    expect(data.meta.title).toBe('Guía completa de SEO Técnico')
    expect(data.meta.description).toBe('Aprende SEO técnico desde cero')
  })

  it('meta.title y meta.description son undefined si no están en frontmatter', () => {
    const post = parsePostFile('content/posts/min.md', MINIMAL_FRONTMATTER)
    const data = buildPostData(post, RESOLVED_IDS)
    expect(data.meta.title).toBeUndefined()
    expect(data.meta.description).toBeUndefined()
  })

  it('publishedAt es una cadena ISO si no está en frontmatter', () => {
    const post = parsePostFile('content/posts/min.md', MINIMAL_FRONTMATTER)
    const data = buildPostData(post, RESOLVED_IDS)
    expect(data.publishedAt).toBeTruthy()
    expect(() => new Date(data.publishedAt)).not.toThrow()
  })

  it('publishedAt usa el valor del frontmatter cuando está presente', () => {
    const post = parsePostFile('content/posts/article.md', VALID_FRONTMATTER)
    const data = buildPostData(post, RESOLVED_IDS)
    expect(data.publishedAt).toBe('2025-01-15T00:00:00Z')
  })

  it('content.content es un objeto (Lexical output)', () => {
    const post = parsePostFile('content/posts/article.md', VALID_FRONTMATTER)
    const data = buildPostData(post, RESOLVED_IDS)
    expect(data.content).toBeDefined()
    expect(data.content.content).toBeDefined()
  })

  it('primaryKeyword es undefined cuando resolvedIds no tiene primaryKeywordId', () => {
    const post = parsePostFile('content/posts/article.md', VALID_FRONTMATTER)
    const data = buildPostData(post, { ...RESOLVED_IDS, primaryKeywordId: undefined })
    expect(data.primaryKeyword).toBeUndefined()
  })

  it('buildPostData con noindex: true produce data.noindex === true (campo top-level)', () => {
    const post = parsePostFile('content/posts/article.md', NOINDEX_FRONTMATTER)
    const data = buildPostData(post, RESOLVED_IDS)
    expect(data.noindex).toBe(true)
  })

  it('buildPostData con noindex undefined produce data.noindex === undefined (campo top-level)', () => {
    const post = parsePostFile('content/posts/article.md', VALID_FRONTMATTER)
    const data = buildPostData(post, RESOLVED_IDS)
    expect(data.noindex).toBeUndefined()
  })
})
