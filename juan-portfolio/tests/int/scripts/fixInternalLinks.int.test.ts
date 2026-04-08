/**
 * Tests de integración para src/scripts/fix-internal-links.ts
 *
 * Ejecuta el script como subproceso con fixtures temporales para verificar:
 *  - --dry-run: detecta enlaces pero NO modifica archivos
 *  - Ejecución normal: convierte enlaces relativos a absolutos
 *  - Sin enlaces relativos: no modifica archivos
 *  - Respeta enlaces ya absolutos (no los toca)
 *  - Respeta enlaces que ya empiezan con /blog/
 *  - Output con resumen correcto
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { execSync, type ExecSyncOptionsWithStringEncoding } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'

// ─── Constantes ────────────────────────────────────────────────────────────────

const SCRIPT_PATH = path.resolve(process.cwd(), 'src/scripts/fix-internal-links.ts')
const BASE_URL = 'https://juan-tech.com/blog'

const EXEC_OPTS: ExecSyncOptionsWithStringEncoding = {
  encoding: 'utf-8',
  stdio: 'pipe',
  timeout: 15_000,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let tmpDir: string
let postsDir: string

function setup() {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jt-fix-links-'))
  postsDir = path.join(tmpDir, 'content', 'posts')
  fs.mkdirSync(postsDir, { recursive: true })
}

function teardown() {
  fs.rmSync(tmpDir, { recursive: true, force: true })
}

function createPost(filename: string, content: string): string {
  const filePath = path.join(postsDir, filename)
  fs.writeFileSync(filePath, content, 'utf-8')
  return filePath
}

function readPost(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8')
}

function runScript(flags: string[] = []): string {
  const flagStr = flags.join(' ')
  return execSync(`npx tsx "${SCRIPT_PATH}" ${flagStr}`.trim(), {
    ...EXEC_OPTS,
    cwd: tmpDir,
  })
}

beforeEach(setup)
afterEach(teardown)

// ─── Tests: --dry-run ─────────────────────────────────────────────────────────

describe('fix-internal-links --dry-run', () => {
  it('detecta enlaces relativos pero NO modifica el archivo', () => {
    const content = '# Artículo\n\nVer [Guía de SEO](/guia-seo) para más info.\n'
    const filePath = createPost('article.md', content)

    runScript(['--dry-run'])

    // El archivo no debe haber cambiado
    expect(readPost(filePath)).toBe(content)
  })

  it('muestra el número de enlaces encontrados en el output', () => {
    createPost('article.md', 'Enlace [uno](/ruta-uno) y [dos](/ruta-dos).\n')
    const output = runScript(['--dry-run'])
    expect(output).toContain('2')
  })

  it('menciona "dry run" o "Dry run" en el output cuando se usa --dry-run', () => {
    createPost('article.md', 'Ver [Guía](/guia).\n')
    const output = runScript(['--dry-run'])
    expect(output.toLowerCase()).toContain('dry run')
  })

  it('con --dry-run, muestra el mensaje de "sin --dry-run" para aplicar cambios', () => {
    createPost('article.md', 'Ver [Guía](/guia).\n')
    const output = runScript(['--dry-run'])
    expect(output).toContain('dry-run')
  })
})

// ─── Tests: ejecución normal ──────────────────────────────────────────────────

describe('fix-internal-links: conversión de enlaces', () => {
  it('convierte enlace relativo [texto](/ruta) a URL absoluta', () => {
    createPost('article.md', 'Ver [Guía de SEO](/guia-seo) aquí.\n')
    runScript()
    const content = readPost(path.join(postsDir, 'article.md'))
    expect(content).toContain(`[Guía de SEO](${BASE_URL}/guia-seo)`)
    expect(content).not.toContain('](/guia-seo)')
  })

  it('convierte múltiples enlaces en el mismo archivo', () => {
    const original = `# Post\n\nVer [Uno](/ruta-uno) y [Dos](/ruta-dos).\n`
    createPost('multi.md', original)
    runScript()
    const content = readPost(path.join(postsDir, 'multi.md'))
    expect(content).toContain(`[Uno](${BASE_URL}/ruta-uno)`)
    expect(content).toContain(`[Dos](${BASE_URL}/ruta-dos)`)
  })

  it('convierte enlaces en múltiples archivos', () => {
    createPost('a.md', 'Link [A](/ruta-a).\n')
    createPost('b.md', 'Link [B](/ruta-b).\n')
    runScript()
    expect(readPost(path.join(postsDir, 'a.md'))).toContain(`${BASE_URL}/ruta-a`)
    expect(readPost(path.join(postsDir, 'b.md'))).toContain(`${BASE_URL}/ruta-b`)
  })

  it('el output muestra el número de archivos modificados', () => {
    createPost('article.md', 'Link [A](/ruta).\n')
    const output = runScript()
    expect(output).toContain('1') // al menos "1" en el resumen
  })
})

// ─── Tests: enlaces que NO deben modificarse ──────────────────────────────────

describe('fix-internal-links: respeta enlaces que ya son correctos', () => {
  it('no modifica enlaces que ya son URLs absolutas https://', () => {
    const content = 'Ver [SEO](https://example.com/seo).\n'
    createPost('abs.md', content)
    runScript()
    expect(readPost(path.join(postsDir, 'abs.md'))).toBe(content)
  })

  it('no modifica enlaces que ya comienzan con /blog/', () => {
    const content = 'Ver [SEO](/blog/guia-seo).\n'
    createPost('blog.md', content)
    runScript()
    expect(readPost(path.join(postsDir, 'blog.md'))).toBe(content)
  })

  it('no modifica archivos sin enlaces relativos', () => {
    const content = '# Sin enlaces\n\nSolo texto sin links.\n'
    createPost('nolinks.md', content)
    runScript()
    expect(readPost(path.join(postsDir, 'nolinks.md'))).toBe(content)
  })

  it('reporta 0 archivos modificados cuando no hay enlaces relativos', () => {
    createPost('clean.md', '# Solo texto\n')
    const output = runScript()
    // El resumen debe mostrar 0 o ningún archivo modificado
    expect(output).toMatch(/Files modified:\s*0/)
  })
})

// ─── Tests: archivos en subdirectorios ───────────────────────────────────────

describe('fix-internal-links: manejo de subdirectorios', () => {
  it('procesa archivos .md en subdirectorios recursivamente', () => {
    const subDir = path.join(postsDir, 'seo', 'tecnico')
    fs.mkdirSync(subDir, { recursive: true })
    const filePath = path.join(subDir, 'article.md')
    fs.writeFileSync(filePath, 'Link [aquí](/ruta-anidada).\n', 'utf-8')

    runScript()

    const content = fs.readFileSync(filePath, 'utf-8')
    expect(content).toContain(`${BASE_URL}/ruta-anidada`)
  })

  it('no procesa archivos que no son .md', () => {
    const txtFile = path.join(postsDir, 'readme.txt')
    const txtContent = 'Link [aquí](/ruta).\n'
    fs.writeFileSync(txtFile, txtContent, 'utf-8')

    runScript()

    // El archivo .txt no debe modificarse
    expect(fs.readFileSync(txtFile, 'utf-8')).toBe(txtContent)
  })
})

// ─── Tests: summary output ────────────────────────────────────────────────────

describe('fix-internal-links: resumen en el output', () => {
  it('muestra resumen con "Files processed", "Files modified", "Total links fixed"', () => {
    createPost('article.md', 'Link [A](/a) y [B](/b).\n')
    const output = runScript()
    expect(output).toContain('Files processed')
    expect(output).toContain('Files modified')
    expect(output).toContain('Total links fixed')
  })

  it('cuenta correctamente el total de enlaces arreglados', () => {
    createPost('a.md', 'Link [1](/uno) y [2](/dos).\n')
    createPost('b.md', 'Link [3](/tres).\n')
    const output = runScript()
    // Total: 3 enlaces arreglados
    expect(output).toContain('3')
  })
})
