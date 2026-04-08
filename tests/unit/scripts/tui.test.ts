/**
 * Tests unitarios para el TUI de scripts (src/scripts/utils/registry.ts)
 *
 * Cubre:
 *  - Validación estructural del registro (campos requeridos, IDs únicos)
 *  - buildCommand(): todos los formatos de argumentos, valores por defecto, edge cases
 *  - Resolución de categorías
 */

import { describe, it, expect } from 'vitest'
import {
  SCRIPTS,
  CATEGORIES,
  buildCommand,
  type Script,
  type CommandSpec,
} from '../../../src/scripts/utils/registry'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Encuentra un script por ID (lanza si no existe). */
function getScript(id: string): Script {
  const s = SCRIPTS.find((s) => s.id === id)
  if (!s) throw new Error(`Script '${id}' no encontrado en el registro`)
  return s
}

// ─── 1. Validación del registro ───────────────────────────────────────────────

describe('Registro de scripts', () => {
  it('contiene al menos 13 scripts', () => {
    expect(SCRIPTS.length).toBeGreaterThanOrEqual(13)
  })

  it('cada script tiene los campos requeridos', () => {
    for (const s of SCRIPTS) {
      expect(s.id, `${s.id}: campo id`).toBeTruthy()
      expect(s.name, `${s.id}: campo name`).toBeTruthy()
      expect(s.category, `${s.id}: campo category`).toBeTruthy()
      expect(s.description, `${s.id}: campo description`).toBeTruthy()
      expect(s.longDescription, `${s.id}: campo longDescription`).toBeTruthy()
      expect(s.baseCommand, `${s.id}: campo baseCommand`).toBeTruthy()
      expect(Array.isArray(s.params), `${s.id}: params debe ser array`).toBe(true)
    }
  })

  it('no hay IDs duplicados', () => {
    const ids = SCRIPTS.map((s) => s.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('cada script pertenece a una categoría conocida', () => {
    const knownCategories = Object.keys(CATEGORIES)
    for (const s of SCRIPTS) {
      expect(knownCategories, `${s.id} usa categoría desconocida: '${s.category}'`).toContain(
        s.category,
      )
    }
  })

  it('cada parámetro tiene los campos requeridos', () => {
    for (const s of SCRIPTS) {
      for (const p of s.params) {
        expect(p.name, `${s.id}/${p.name}: campo name`).toBeTruthy()
        expect(p.type, `${s.id}/${p.name}: campo type`).toBeTruthy()
        expect(typeof p.required, `${s.id}/${p.name}: required debe ser boolean`).toBe('boolean')
        expect(p.description, `${s.id}/${p.name}: campo description`).toBeTruthy()
      }
    }
  })

  it('los parámetros de tipo "select" tienen opciones definidas', () => {
    for (const s of SCRIPTS) {
      for (const p of s.params) {
        if (p.type === 'select') {
          expect(p.options, `${s.id}/${p.name}: select sin options`).toBeDefined()
          expect(p.options!.length, `${s.id}/${p.name}: select sin opciones`).toBeGreaterThan(0)
        }
      }
    }
  })

  it('tiene scripts en las 3 categorías', () => {
    const categories = new Set(SCRIPTS.map((s) => s.category))
    expect(categories).toContain('content')
    expect(categories).toContain('seo')
    expect(categories).toContain('maintenance')
  })

  it('CATEGORIES define label y hint para cada categoría usada', () => {
    const usedCategories = new Set(SCRIPTS.map((s) => s.category))
    for (const cat of usedCategories) {
      expect(CATEGORIES[cat], `Categoría '${cat}' sin entrada en CATEGORIES`).toBeDefined()
      expect(CATEGORIES[cat]!.label).toBeTruthy()
      expect(CATEGORIES[cat]!.hint).toBeTruthy()
    }
  })
})

// ─── 2. buildCommand — parámetros tipo flag ───────────────────────────────────

describe('buildCommand: flags', () => {
  const script = getScript('build-internal-links')

  it('incluye --dry-run cuando es true', () => {
    const { args, display } = buildCommand(script, { '--dry-run': true })
    expect(args).toContain('--dry-run')
    expect(display).toContain('--dry-run')
  })

  it('omite --dry-run cuando es false', () => {
    const { args } = buildCommand(script, { '--dry-run': false })
    expect(args).not.toContain('--dry-run')
  })

  it('omite --dry-run cuando es undefined', () => {
    const { args } = buildCommand(script, {})
    expect(args).not.toContain('--dry-run')
  })

  it('incluye múltiples flags simultáneamente', () => {
    const { args } = buildCommand(script, {
      '--dry-run': true,
      '--classify': true,
      '--verbose': true,
    })
    expect(args).toContain('--dry-run')
    expect(args).toContain('--classify')
    expect(args).toContain('--verbose')
  })

  it('sync-keywords: --fetch-serp y --verbose como flags', () => {
    const s = getScript('sync-keywords')
    const { args } = buildCommand(s, { '--fetch-serp': true, '--verbose': true })
    expect(args).toContain('--fetch-serp')
    expect(args).toContain('--verbose')
  })

  it('update-cwv: --force flag', () => {
    const s = getScript('update-cwv')
    const { args } = buildCommand(s, { '--force': true })
    expect(args).toContain('--force')
  })

  it('fix-internal-links: --dry-run flag', () => {
    const s = getScript('fix-internal-links')
    const { args } = buildCommand(s, { '--dry-run': true })
    expect(args).toContain('--dry-run')
  })
})

// ─── 3. buildCommand — subcommands ───────────────────────────────────────────

describe('buildCommand: subcommands (format: subcommand)', () => {
  const script = getScript('sync-content')

  it('inserta subcommand "status" en el lugar correcto', () => {
    const { args, display } = buildCommand(script, { 'Operación': 'status' })
    // El subcommand va después del path del script
    const scriptIdx = args.findIndex((a) => a.includes('syncContent'))
    expect(args[scriptIdx + 1]).toBe('status')
    expect(display).toContain('status')
  })

  it('inserta subcommand "push" con --force', () => {
    const { args, display } = buildCommand(script, {
      'Operación': 'push',
      '--force': true,
    })
    expect(args).toContain('push')
    expect(args).toContain('--force')
    expect(display).toContain('push --force')
  })

  it('inserta subcommand "push" con --post', () => {
    const { args, display } = buildCommand(script, {
      'Operación': 'push',
      '--post': 'mi-articulo.md',
    })
    expect(args).toContain('push')
    expect(args.some((a) => a.startsWith('--post='))).toBe(true)
    expect(display).toContain('--post=mi-articulo.md')
  })

  it('omite --post si está vacío', () => {
    const { args } = buildCommand(script, { 'Operación': 'pull', '--post': '' })
    expect(args.some((a) => a.startsWith('--post'))).toBe(false)
  })
})

// ─── 4. buildCommand — formato space ────────────────────────────────────────

describe('buildCommand: format space (--key valor)', () => {
  const script = getScript('build-internal-links')

  it('añade --locale es como dos elementos separados', () => {
    const { args, display } = buildCommand(script, { '--locale': 'es' })
    const idx = args.indexOf('--locale')
    expect(idx).toBeGreaterThan(-1)
    expect(args[idx + 1]).toBe('es')
    expect(display).toContain('--locale es')
  })

  it('añade --locale en como dos elementos separados', () => {
    const { args } = buildCommand(script, { '--locale': 'en' })
    expect(args.indexOf('--locale')).toBeGreaterThan(-1)
    expect(args[args.indexOf('--locale') + 1]).toBe('en')
  })

  it('omite --locale cuando es vacío (sin filtro)', () => {
    const { args } = buildCommand(script, { '--locale': '' })
    expect(args).not.toContain('--locale')
  })

  it('añade --category como par space', () => {
    const { args, display } = buildCommand(script, { '--category': 'tech-seo' })
    expect(args.indexOf('--category')).toBeGreaterThan(-1)
    expect(args[args.indexOf('--category') + 1]).toBe('tech-seo')
    expect(display).toContain('--category tech-seo')
  })

  it('omite --category si está vacío', () => {
    const { args } = buildCommand(script, { '--category': '' })
    expect(args).not.toContain('--category')
  })

  it('añade --max-links cuando difiere del default (3)', () => {
    const { args, display } = buildCommand(script, { '--max-links': 5 })
    expect(args.indexOf('--max-links')).toBeGreaterThan(-1)
    expect(args[args.indexOf('--max-links') + 1]).toBe('5')
    expect(display).toContain('--max-links 5')
  })

  it('omite --max-links cuando coincide con el default (3)', () => {
    const { args } = buildCommand(script, { '--max-links': 3 })
    expect(args).not.toContain('--max-links')
  })
})

// ─── 5. buildCommand — formato equals ────────────────────────────────────────

describe('buildCommand: format equals (--key=valor)', () => {
  const script = getScript('update-seo-metrics')

  it('añade --source=mock cuando difiere del default (serpapi)', () => {
    const { args, display } = buildCommand(script, { '--source': 'mock' })
    expect(args.some((a) => a === '--source=mock')).toBe(true)
    expect(display).toContain('--source=mock')
  })

  it('añade --source=dataforseo', () => {
    const { args } = buildCommand(script, { '--source': 'dataforseo' })
    expect(args.some((a) => a === '--source=dataforseo')).toBe(true)
  })

  it('omite --source cuando es el default (serpapi)', () => {
    const { args } = buildCommand(script, { '--source': 'serpapi' })
    expect(args.some((a) => a.startsWith('--source'))).toBe(false)
  })

  it('omite --source cuando está vacío', () => {
    const { args } = buildCommand(script, { '--source': '' })
    expect(args.some((a) => a.startsWith('--source'))).toBe(false)
  })

  it('sync-content: --post usa formato equals', () => {
    const s = getScript('sync-content')
    const { args } = buildCommand(s, { 'Operación': 'push', '--post': 'guia.md' })
    expect(args.some((a) => a === '--post=guia.md')).toBe(true)
  })
})

// ─── 6. buildCommand — args posicionales ─────────────────────────────────────

describe('buildCommand: args posicionales', () => {
  const script = getScript('search-keyword')

  it('añade la keyword como argumento posicional', () => {
    const { args, display } = buildCommand(script, { keyword: 'technical seo' })
    expect(args).toContain('technical seo')
    // El display debe envolver en comillas los valores con espacios
    expect(display).toContain('"technical seo"')
  })

  it('keyword sin espacios no lleva comillas en display', () => {
    const { display, args } = buildCommand(script, { keyword: 'seo' })
    expect(args).toContain('seo')
    expect(display).toContain('seo')
    expect(display).not.toContain('"seo"')
  })

  it('omite la keyword si está vacía', () => {
    const { args } = buildCommand(script, { keyword: '' })
    const scriptIdx = args.findIndex((a) => a.includes('search-keyword'))
    expect(args.length).toBe(scriptIdx + 1) // nada después del script path
  })
})

// ─── 7. buildCommand — scripts sin parámetros ────────────────────────────────

describe('buildCommand: scripts sin parámetros', () => {
  const noParamScripts = [
    'check-links',
    'sync-gsc',
    'fetch-redirects',
    'delete-loop-redirects',
    'fix-user-slugs',
    'debug-content',
    'test-email',
  ]

  for (const id of noParamScripts) {
    it(`${id}: produce exactamente el comando base`, () => {
      const s = getScript(id)
      const { display, bin, args } = buildCommand(s, {})
      expect(display).toBe(s.baseCommand)
      expect(bin).toBe(s.baseCommand.split(' ')[0])
      expect([bin, ...args].join(' ')).toBe(s.baseCommand)
    })
  }
})

// ─── 8. buildCommand — estructura CommandSpec ────────────────────────────────

describe('buildCommand: estructura de CommandSpec', () => {
  it('bin siempre es "tsx"', () => {
    for (const s of SCRIPTS) {
      const { bin } = buildCommand(s, {})
      expect(bin).toBe('tsx')
    }
  })

  it('display es la concatenación de bin + args con espacios', () => {
    const s = getScript('build-internal-links')
    const spec: CommandSpec = buildCommand(s, { '--dry-run': true, '--locale': 'es' })
    // Verificar que display = bin + args (excepto por las comillas)
    const reconstructed = [spec.bin, ...spec.args].join(' ')
    // Sin espacios en args, display == reconstructed
    expect(spec.display).toBe(reconstructed)
  })

  it('args no contiene el bin ("tsx")', () => {
    for (const s of SCRIPTS) {
      const { args } = buildCommand(s, {})
      expect(args).not.toContain('tsx')
    }
  })

  it('el script path siempre está en args[0] o args[2] según use -r dotenv/config', () => {
    for (const s of SCRIPTS) {
      const { args } = buildCommand(s, {})
      const hasRequire = args[0] === '-r'
      if (hasRequire) {
        expect(args[1]).toBe('dotenv/config')
        expect(args[2]).toContain('src/scripts')
      } else {
        expect(args[0]).toContain('src/scripts')
      }
    }
  })
})

// ─── 9. buildCommand — combinaciones complejas ───────────────────────────────

describe('buildCommand: combinaciones multi-param', () => {
  it('build-internal-links: classify + dry-run + locale + max-links', () => {
    const s = getScript('build-internal-links')
    const { args, display } = buildCommand(s, {
      '--classify': true,
      '--dry-run': true,
      '--locale': 'es',
      '--max-links': 5,
      '--verbose': false,
    })
    expect(args).toContain('--classify')
    expect(args).toContain('--dry-run')
    expect(args).toContain('--locale')
    expect(args[args.indexOf('--locale') + 1]).toBe('es')
    expect(args).toContain('--max-links')
    expect(args[args.indexOf('--max-links') + 1]).toBe('5')
    expect(args).not.toContain('--verbose')
    // --dry-run y --classify están presentes (el orden depende del registro)
    expect(display).toContain('--classify')
    expect(display).toContain('--dry-run')
  })

  it('update-seo-metrics: source=mock + analyze-gap + all', () => {
    const s = getScript('update-seo-metrics')
    const { args } = buildCommand(s, {
      '--source': 'mock',
      '--analyze-gap': true,
      '--all': true,
    })
    expect(args.some((a) => a === '--source=mock')).toBe(true)
    expect(args).toContain('--analyze-gap')
    expect(args).toContain('--all')
  })

  it('sync-content: todos los params — status sin extras', () => {
    const s = getScript('sync-content')
    const { args } = buildCommand(s, {
      'Operación': 'status',
      '--force': false,
      '--post': '',
    })
    expect(args).toContain('status')
    expect(args).not.toContain('--force')
    expect(args.some((a) => a.startsWith('--post'))).toBe(false)
  })
})
