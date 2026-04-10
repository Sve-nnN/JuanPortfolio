/**
 * Tests unitarios para src/scripts/sync/stateManager.ts
 *
 * Cubre:
 *  - calculateHash: determinismo y sensibilidad a cambios
 *  - loadState: estado vacío cuando el archivo no existe, migración de idioma→locale
 *  - saveState: escribe JSON bien formateado y legible por loadState
 *  - getAllMdFiles: descubrimiento recursivo de archivos .md
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { calculateHash, loadState, saveState, getAllMdFiles } from '../../../src/scripts/sync/stateManager'
import type { SyncState } from '../../../src/scripts/sync/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jt-stateManager-test-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

// ─── calculateHash ────────────────────────────────────────────────────────────

describe('calculateHash', () => {
  it('produce el mismo hash para el mismo contenido', () => {
    const content = '# Artículo de prueba\n\nContenido de ejemplo.'
    expect(calculateHash(content)).toBe(calculateHash(content))
  })

  it('produce hashes diferentes para contenidos distintos', () => {
    expect(calculateHash('contenido A')).not.toBe(calculateHash('contenido B'))
  })

  it('el hash es sensible a espacios y saltos de línea', () => {
    expect(calculateHash('hola\n')).not.toBe(calculateHash('hola'))
    expect(calculateHash(' hola')).not.toBe(calculateHash('hola'))
  })

  it('produce una cadena hexadecimal de 64 caracteres (SHA-256)', () => {
    const hash = calculateHash('cualquier contenido')
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('funciona con cadenas vacías', () => {
    const hash = calculateHash('')
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('funciona con contenido unicode', () => {
    const hash1 = calculateHash('Guía de SEO técnico')
    const hash2 = calculateHash('Guia de SEO tecnico')
    expect(hash1).not.toBe(hash2)
  })
})

// ─── loadState ────────────────────────────────────────────────────────────────

describe('loadState', () => {
  it('retorna estado vacío cuando el archivo no existe', () => {
    const nonExistent = path.join(tmpDir, 'does-not-exist.json')
    const state = loadState(nonExistent)
    expect(state).toEqual({ files: {} })
  })

  it('carga un estado previamente guardado', () => {
    const stateFile = path.join(tmpDir, 'content-sync.json')
    const original: SyncState = {
      files: {
        'content/posts/article.md': {
          id: 'post-123',
          slug: 'article',
          locale: 'es',
          lastLocalHash: 'abc123',
          lastRemoteUpdatedAt: '2025-01-01T00:00:00Z',
        },
      },
    }
    saveState(stateFile, original)
    const loaded = loadState(stateFile)
    expect(loaded).toEqual(original)
  })

  it('migra el campo "idioma" legacy a "locale"', () => {
    const stateFile = path.join(tmpDir, 'content-sync-legacy.json')
    // Estado con formato legacy (usa "idioma" en lugar de "locale")
    const legacyState = {
      files: {
        'content/posts/old-article.md': {
          id: 'post-legacy',
          slug: 'old-article',
          idioma: 'en', // campo legacy
          lastLocalHash: 'def456',
          lastRemoteUpdatedAt: '2024-06-01T00:00:00Z',
        },
      },
    }
    fs.writeFileSync(stateFile, JSON.stringify(legacyState, null, 2))
    const loaded = loadState(stateFile)
    expect(loaded.files['content/posts/old-article.md']?.locale).toBe('en')
    // No debe haber campo "idioma" en el resultado
    expect((loaded.files['content/posts/old-article.md'] as unknown as Record<string, unknown>)?.idioma).toBeUndefined()
  })

  it('usa "es" como locale default si no hay ni idioma ni locale', () => {
    const stateFile = path.join(tmpDir, 'content-sync-no-locale.json')
    const stateWithoutLocale = {
      files: {
        'content/posts/article.md': {
          id: 'post-no-locale',
          slug: 'article',
          // sin locale ni idioma
          lastLocalHash: 'ghi789',
          lastRemoteUpdatedAt: '2024-01-01T00:00:00Z',
        },
      },
    }
    fs.writeFileSync(stateFile, JSON.stringify(stateWithoutLocale))
    const loaded = loadState(stateFile)
    expect(loaded.files['content/posts/article.md']?.locale).toBe('es')
  })

  it('carga múltiples entradas de archivos', () => {
    const stateFile = path.join(tmpDir, 'multi.json')
    const state: SyncState = {
      files: {
        'a.md': { id: '1', slug: 'a', locale: 'es', lastLocalHash: 'h1', lastRemoteUpdatedAt: 'T1' },
        'b.en.md': { id: '2', slug: 'b', locale: 'en', lastLocalHash: 'h2', lastRemoteUpdatedAt: 'T2' },
        'c.es.md': { id: '3', slug: 'c', locale: 'es', lastLocalHash: 'h3', lastRemoteUpdatedAt: 'T3' },
      },
    }
    saveState(stateFile, state)
    const loaded = loadState(stateFile)
    expect(Object.keys(loaded.files)).toHaveLength(3)
    expect(loaded.files['b.en.md']?.locale).toBe('en')
  })
})

// ─── saveState ────────────────────────────────────────────────────────────────

describe('saveState', () => {
  it('escribe un archivo JSON bien formateado', () => {
    const stateFile = path.join(tmpDir, 'content-sync.json')
    const state: SyncState = {
      files: {
        'test.md': {
          id: 'test-id',
          slug: 'test',
          locale: 'es',
          lastLocalHash: 'xyz',
          lastRemoteUpdatedAt: '2025-01-01T00:00:00Z',
        },
      },
    }
    saveState(stateFile, state)
    const raw = fs.readFileSync(stateFile, 'utf-8')
    const parsed = JSON.parse(raw)
    expect(parsed).toEqual(state)
    // Verifica que está formateado con indentación (no es una sola línea)
    expect(raw).toContain('\n')
  })

  it('el estado guardado puede ser leído por loadState sin pérdida de datos', () => {
    const stateFile = path.join(tmpDir, 'roundtrip.json')
    const original: SyncState = {
      files: {
        'content/posts/roundtrip.en.md': {
          id: 'rt-1',
          slug: 'roundtrip',
          locale: 'en',
          lastLocalHash: calculateHash('contenido de prueba'),
          lastRemoteUpdatedAt: new Date().toISOString(),
        },
      },
    }
    saveState(stateFile, original)
    const loaded = loadState(stateFile)
    expect(loaded).toEqual(original)
  })

  it('sobrescribe el archivo si ya existe', () => {
    const stateFile = path.join(tmpDir, 'overwrite.json')
    const state1: SyncState = { files: { 'a.md': { id: '1', slug: 'a', locale: 'es', lastLocalHash: 'h1', lastRemoteUpdatedAt: 'T1' } } }
    const state2: SyncState = { files: { 'b.md': { id: '2', slug: 'b', locale: 'en', lastLocalHash: 'h2', lastRemoteUpdatedAt: 'T2' } } }
    saveState(stateFile, state1)
    saveState(stateFile, state2)
    const loaded = loadState(stateFile)
    expect(Object.keys(loaded.files)).toHaveLength(1)
    expect(loaded.files['b.md']).toBeDefined()
    expect(loaded.files['a.md']).toBeUndefined()
  })
})

// ─── getAllMdFiles ────────────────────────────────────────────────────────────

describe('getAllMdFiles', () => {
  it('retorna array vacío en directorio sin archivos .md', () => {
    // tmpDir vacío (solo tiene lo que creamos)
    const emptyDir = path.join(tmpDir, 'empty')
    fs.mkdirSync(emptyDir)
    const files = getAllMdFiles(emptyDir)
    expect(files).toEqual([])
  })

  it('retorna archivos .md en el directorio raíz', () => {
    fs.writeFileSync(path.join(tmpDir, 'article.md'), '# Test')
    fs.writeFileSync(path.join(tmpDir, 'guide.en.md'), '# Guide')
    fs.writeFileSync(path.join(tmpDir, 'readme.txt'), 'not markdown')
    const files = getAllMdFiles(tmpDir)
    expect(files).toHaveLength(2)
    expect(files.every((f) => f.endsWith('.md'))).toBe(true)
  })

  it('descubre archivos .md recursivamente en subdirectorios', () => {
    const subDir = path.join(tmpDir, 'posts', 'seo')
    fs.mkdirSync(subDir, { recursive: true })
    fs.writeFileSync(path.join(tmpDir, 'root.md'), '# Root')
    fs.writeFileSync(path.join(subDir, 'nested.md'), '# Nested')
    fs.writeFileSync(path.join(subDir, 'nested.en.md'), '# Nested EN')
    const files = getAllMdFiles(tmpDir)
    expect(files).toHaveLength(3)
  })

  it('no incluye archivos que no terminan en .md', () => {
    fs.writeFileSync(path.join(tmpDir, 'article.md'), '# MD')
    fs.writeFileSync(path.join(tmpDir, 'script.ts'), 'export {}')
    fs.writeFileSync(path.join(tmpDir, 'data.json'), '{}')
    fs.writeFileSync(path.join(tmpDir, 'image.png'), 'binary')
    const files = getAllMdFiles(tmpDir)
    expect(files).toHaveLength(1)
    expect(files[0]).toContain('article.md')
  })

  it('retorna rutas absolutas', () => {
    fs.writeFileSync(path.join(tmpDir, 'article.md'), '# Test')
    const files = getAllMdFiles(tmpDir)
    expect(files[0]).toMatch(/^\//)
  })
})
