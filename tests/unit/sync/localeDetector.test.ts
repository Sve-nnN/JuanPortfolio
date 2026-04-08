/**
 * Tests unitarios para src/scripts/sync/localeDetector.ts
 *
 * Cubre las 3 reglas de detección de locale:
 *  1. Sufijo en el nombre de archivo (.en.md, .es.md) — máxima prioridad
 *  2. Campo frontmatter idioma — segunda prioridad
 *  3. Default 'es' — cuando ninguno de los anteriores aplica
 */

import { describe, it, expect } from 'vitest'
import { detectLocale, getBaseSlug, isMdFile } from '../../../src/scripts/sync/localeDetector'

// ─── detectLocale ─────────────────────────────────────────────────────────────

describe('detectLocale', () => {
  // ── Regla 1: sufijo de archivo ──────────────────────────────────────────────

  describe('detecta locale por sufijo de archivo', () => {
    it('archivo .en.md → en', () => {
      expect(detectLocale('content/posts/nextjs-guide.en.md')).toBe('en')
    })

    it('archivo .es.md → es', () => {
      expect(detectLocale('content/posts/guia-seo.es.md')).toBe('es')
    })

    it('archivo .en.md con ruta anidada → en', () => {
      expect(detectLocale('/absolute/path/to/posts/article.en.md')).toBe('en')
    })

    it('archivo .es.md con ruta anidada → es', () => {
      expect(detectLocale('posts/tech/seo/article.es.md')).toBe('es')
    })

    it('sufijo de archivo tiene prioridad sobre frontmatter idioma=es cuando es .en.md', () => {
      expect(detectLocale('article.en.md', 'es')).toBe('en')
    })

    it('sufijo de archivo tiene prioridad sobre frontmatter idioma=en cuando es .es.md', () => {
      expect(detectLocale('article.es.md', 'en')).toBe('es')
    })
  })

  // ── Regla 2: frontmatter idioma ────────────────────────────────────────────

  describe('detecta locale por frontmatter cuando no hay sufijo', () => {
    it('archivo .md con idioma="en" → en', () => {
      expect(detectLocale('content/posts/guide.md', 'en')).toBe('en')
    })

    it('archivo .md con idioma="es" → es', () => {
      expect(detectLocale('content/posts/guia.md', 'es')).toBe('es')
    })

    it('solo el nombre base (sin directorio) con idioma="en" → en', () => {
      expect(detectLocale('article.md', 'en')).toBe('en')
    })
  })

  // ── Regla 3: default 'es' ──────────────────────────────────────────────────

  describe('cae en default "es"', () => {
    it('archivo .md sin frontmatter → es', () => {
      expect(detectLocale('content/posts/article.md')).toBe('es')
    })

    it('archivo .md sin frontmatter y frontmatterLocale undefined → es', () => {
      expect(detectLocale('article.md', undefined)).toBe('es')
    })

    it('archivo con extensión desconocida sin frontmatter → es', () => {
      // No debería pasar en uso normal, pero el comportamiento debe ser el default
      expect(detectLocale('file.txt')).toBe('es')
    })
  })

  // ── Edge cases ─────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('archivo con "en" en el nombre (no sufijo) no es inglés', () => {
      // "frontend.md" no debe detectarse como inglés
      expect(detectLocale('content/posts/frontend.md')).toBe('es')
    })

    it('archivo con "es" en el nombre (no sufijo) no determina locale', () => {
      expect(detectLocale('content/posts/css-tips.md')).toBe('es')
    })

    it('archivo con .md anidado en el nombre no confunde sufijo', () => {
      // "readme.md.backup" no tiene el sufijo .en.md
      expect(detectLocale('readme.md.backup')).toBe('es')
    })
  })
})

// ─── getBaseSlug ──────────────────────────────────────────────────────────────

describe('getBaseSlug', () => {
  it('elimina sufijo .en.md', () => {
    expect(getBaseSlug('nextjs-portfolio.en.md')).toBe('nextjs-portfolio')
  })

  it('elimina sufijo .es.md', () => {
    expect(getBaseSlug('guia-seo-tecnico.es.md')).toBe('guia-seo-tecnico')
  })

  it('elimina extensión .md (sin sufijo de locale)', () => {
    expect(getBaseSlug('guia-seo.md')).toBe('guia-seo')
  })

  it('ignora la ruta del directorio (usa solo el nombre de archivo)', () => {
    expect(getBaseSlug('content/posts/tech/nextjs-portfolio.en.md')).toBe('nextjs-portfolio')
  })

  it('slug con guiones y números', () => {
    expect(getBaseSlug('top-10-seo-tools-2025.en.md')).toBe('top-10-seo-tools-2025')
  })

  it('slug con caracteres especiales mantiene slug original', () => {
    expect(getBaseSlug('cómo-usar-seo.md')).toBe('cómo-usar-seo')
  })

  it('archivo en la raíz sin directorio', () => {
    expect(getBaseSlug('article.md')).toBe('article')
  })
})

// ─── isMdFile ─────────────────────────────────────────────────────────────────

describe('isMdFile', () => {
  it('retorna true para .md', () => {
    expect(isMdFile('article.md')).toBe(true)
  })

  it('retorna true para .en.md', () => {
    expect(isMdFile('article.en.md')).toBe(true)
  })

  it('retorna true para .es.md', () => {
    expect(isMdFile('article.es.md')).toBe(true)
  })

  it('retorna false para .ts', () => {
    expect(isMdFile('script.ts')).toBe(false)
  })

  it('retorna false para .tsx', () => {
    expect(isMdFile('component.tsx')).toBe(false)
  })

  it('retorna false para .json', () => {
    expect(isMdFile('data.json')).toBe(false)
  })

  it('retorna false para cadena vacía', () => {
    expect(isMdFile('')).toBe(false)
  })

  it('retorna false para archivo sin extensión', () => {
    expect(isMdFile('Makefile')).toBe(false)
  })
})
