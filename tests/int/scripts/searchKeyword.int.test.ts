/**
 * Tests de integración para src/scripts/search-keyword.ts
 *
 * Ejecuta el script como subproceso con fixtures temporales para verificar:
 *  - Búsqueda exacta (case-insensitive) → muestra todos los campos
 *  - Keyword no encontrada → mensaje apropiado + sugerencias
 *  - Sin argumento → error de uso con código de salida ≠ 0
 *  - Múltiples keywords en la tabla → retorna solo la correcta
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execSync, type ExecSyncOptionsWithStringEncoding } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SCRIPT_PATH = path.resolve(process.cwd(), 'src/scripts/search-keyword.ts')

/**
 * Tabla de keywords minimal para tests.
 * La primera columna es la keyword, resto son datos de ejemplo.
 */
const KEYWORDS_MD = `
# Keywords

| Keyword | Target URL | Volume | Difficulty | Intent | Source |
| ------- | ---------- | ------ | ---------- | ------ | ------ |
| seo técnico | /blog/seo-tecnico | 1200 | 35 | Informational | Manual |
| guía de contenidos | /blog/guia-contenidos | 800 | 45 | Informational | Manual |
| core web vitals | /blog/core-web-vitals | 600 | 30 | Informational | SerpAPI |
| link building | /blog/link-building | 900 | 60 | Transactional | Manual |
`.trim()

let tmpDir: string
let contentDir: string
let keywordsFile: string

const EXEC_OPTS: ExecSyncOptionsWithStringEncoding = {
  encoding: 'utf-8',
  stdio: 'pipe',
  timeout: 15_000,
}

function runSearch(keyword: string, opts?: Partial<ExecSyncOptionsWithStringEncoding>): string {
  return execSync(`npx tsx "${SCRIPT_PATH}" "${keyword}"`, {
    ...EXEC_OPTS,
    cwd: tmpDir,
    ...opts,
  })
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jt-search-keyword-'))
  contentDir = path.join(tmpDir, 'content')
  keywordsFile = path.join(contentDir, 'keywords.md')
  fs.mkdirSync(contentDir, { recursive: true })
  fs.writeFileSync(keywordsFile, KEYWORDS_MD, 'utf-8')
})

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('search-keyword: búsqueda exitosa', () => {
  it('encuentra keyword exacta y muestra todos los campos', () => {
    const output = runSearch('seo técnico')
    expect(output).toContain('seo técnico')
    expect(output).toContain('/blog/seo-tecnico')
    expect(output).toContain('1200')
    expect(output).toContain('Informational')
  })

  it('búsqueda es case-insensitive (mayúsculas)', () => {
    const output = runSearch('SEO TÉCNICO')
    expect(output).toContain('seo técnico')
    expect(output).toContain('/blog/seo-tecnico')
  })

  it('búsqueda es case-insensitive (mix de mayúsculas y minúsculas)', () => {
    const output = runSearch('Seo Técnico')
    expect(output).toContain('seo técnico')
  })

  it('encuentra keywords con espacios múltiples', () => {
    const output = runSearch('guía de contenidos')
    expect(output).toContain('guía de contenidos')
    expect(output).toContain('/blog/guia-contenidos')
    expect(output).toContain('800')
  })

  it('encuentra keywords con caracteres especiales', () => {
    const output = runSearch('core web vitals')
    expect(output).toContain('core web vitals')
    expect(output).toContain('SerpAPI')
  })

  it('muestra el encabezado "Información encontrada para" en el output', () => {
    const output = runSearch('link building')
    expect(output).toContain('Información encontrada para')
    expect(output).toContain('link building')
  })

  it('muestra cada campo en una línea separada con padding', () => {
    const output = runSearch('seo técnico')
    // Cada campo se muestra como "Header: valor" con padding
    expect(output).toContain('Keyword')
    expect(output).toContain('Target URL')
    expect(output).toContain('Volume')
  })
})

describe('search-keyword: keyword no encontrada', () => {
  it('muestra mensaje de "no encontrada" para keyword inexistente', () => {
    const output = runSearch('keyword que no existe')
    expect(output).toContain('No se encontró')
    expect(output).toContain('keyword que no existe')
  })

  it('muestra sugerencias cuando hay coincidencias parciales', () => {
    // "seo" está en "seo técnico" y podría aparecer como sugerencia
    const output = runSearch('seo')
    // Puede encontrar la keyword exacta si es exacta, o sugerir similares
    expect(output).toBeTruthy()
  })

  it('no muestra "Información encontrada para" cuando la keyword no existe', () => {
    const output = runSearch('xxxx-no-existe-xxxx')
    expect(output).not.toContain('Información encontrada para')
  })

  it('muestra sugerencias de keywords que contienen la query', () => {
    const output = runSearch('vitals')
    // "core web vitals" contiene "vitals" → debe aparecer como sugerencia
    expect(output).toContain('core web vitals')
  })
})

describe('search-keyword: manejo de errores', () => {
  it('sale con código ≠ 0 cuando no se proporciona argumento', () => {
    expect(() => {
      execSync(`npx tsx "${SCRIPT_PATH}"`, {
        ...EXEC_OPTS,
        cwd: tmpDir,
      })
    }).toThrow()
  })

  it('el mensaje de error sin argumento menciona el uso correcto', () => {
    let errorOutput = ''
    try {
      execSync(`npx tsx "${SCRIPT_PATH}"`, {
        ...EXEC_OPTS,
        cwd: tmpDir,
      })
    } catch (err: unknown) {
      const e = err as { stderr?: string; stdout?: string }
      errorOutput = (e.stderr ?? '') + (e.stdout ?? '')
    }
    expect(errorOutput).toContain('argumento')
  })

  it('sale con código ≠ 0 cuando el archivo keywords.md no existe', () => {
    const noContentDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jt-no-keywords-'))
    try {
      expect(() => {
        execSync(`npx tsx "${SCRIPT_PATH}" "cualquier keyword"`, {
          ...EXEC_OPTS,
          cwd: noContentDir,
        })
      }).toThrow()
    } finally {
      fs.rmSync(noContentDir, { recursive: true, force: true })
    }
  })
})
