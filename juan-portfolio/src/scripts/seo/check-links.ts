import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../../payload.config'
import { LinkChecker } from 'linkinator'
import natural from 'natural'
import enquirer from 'enquirer'
import { getPostUrl } from '../../utilities/getPostUrl'
import type { Post, Page } from '@/payload-types'

// ─── ANSI ─────────────────────────────────────────────────────────────────────

const c = {
  reset:   '\x1b[0m',
  bright:  '\x1b[1m',
  dim:     '\x1b[2m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  cyan:    '\x1b[36m',
  red:     '\x1b[31m',
  magenta: '\x1b[35m',
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CliArgs {
  /** Activar creación de redirects tras el escaneo. Alias: --fix */
  createRedirects: boolean
  /** No pedir confirmación: usar la mejor coincidencia automáticamente. */
  auto: boolean
  /** Mostrar qué redirects se crearían sin modificar el CMS. */
  dryRun: boolean
  /** Puntuación mínima de similitud (0–1) para aceptar una coincidencia en modo auto. */
  minScore: number
}

interface ContentEntry {
  slug:       string
  title:      string
  /** Ruta relativa canónica, ej. /blog/seo/guia-seo o /en/blog/seo/guia-seo */
  path:       string
  locale:     'es' | 'en'
  collection: 'posts' | 'pages'
}

interface Candidate {
  entry: ContentEntry
  score: number
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

function parseArgs(): CliArgs {
  const argv = process.argv.slice(2)
  const minScoreArg = argv.find(a => a.startsWith('--min-score='))
  return {
    createRedirects: argv.includes('--create-redirects') || argv.includes('--fix'),
    auto:            argv.includes('--auto'),
    dryRun:          argv.includes('--dry-run'),
    minScore:        minScoreArg ? parseFloat(minScoreArg.split('=')[1]!) : 0.72,
  }
}

function printHelp() {
  console.log(`
${c.bright}Uso:${c.reset} tsx src/scripts/seo/check-links.ts [opciones]

${c.bright}Opciones:${c.reset}
  --create-redirects   Activar creación de redirects para enlaces internos rotos
  --fix                Alias de --create-redirects
  --auto               Seleccionar automáticamente la mejor coincidencia (modo no interactivo)
  --dry-run            Mostrar redirects propuestos sin crearlos en el CMS
  --min-score=<n>      Umbral de similitud para modo --auto (default: 0.72, rango 0–1)

${c.bright}Ejemplos:${c.reset}
  tsx src/scripts/seo/check-links.ts
  tsx src/scripts/seo/check-links.ts --create-redirects
  tsx src/scripts/seo/check-links.ts --fix --auto
  tsx src/scripts/seo/check-links.ts --fix --auto --min-score=0.8 --dry-run
`)
}

// ─── URL helpers ─────────────────────────────────────────────────────────────

function extractPath(fullUrl: string, siteUrl: string): string {
  try {
    const link = new URL(fullUrl)
    const base = new URL(siteUrl)
    if (link.hostname !== base.hostname) return ''
    return link.pathname.replace(/\/$/, '') || '/'
  } catch { return '' }
}

function isInternal(url: string, siteUrl: string): boolean {
  if (!url) return false
  if (url.startsWith('/')) return true
  try {
    return new URL(url).hostname === new URL(siteUrl).hostname
  } catch { return false }
}

/** Infiere el locale de una ruta: /en/... → 'en', todo lo demás → 'es'. */
function pathLocale(path: string): 'es' | 'en' {
  return path.startsWith('/en/') || path === '/en' ? 'en' : 'es'
}

// ─── Content index ────────────────────────────────────────────────────────────

/**
 * Construye un índice de todos los posts y pages publicados con sus rutas
 * canónicas en ambos idiomas, para usarlo en el fuzzy matching.
 */
async function buildContentIndex(
  payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<ContentEntry[]> {
  const [{ docs: posts }, { docs: pages }] = await Promise.all([
    payload.find({ collection: 'posts',  limit: 1000, depth: 1 }),
    payload.find({ collection: 'pages',  limit: 500,  depth: 0 }),
  ])

  const entries: ContentEntry[] = []

  for (const doc of posts as unknown as Post[]) {
    if (!doc.slug) continue
    const title = doc.title
    for (const locale of ['es', 'en'] as const) {
      entries.push({
        slug: doc.slug,
        title,
        path: getPostUrl(doc, locale),
        locale,
        collection: 'posts',
      })
    }
  }

  for (const doc of pages as unknown as Page[]) {
    if (!doc.slug) continue
    const basePath = doc.slug === 'home' ? '/' : `/${doc.slug}`
    const title = doc.title
    entries.push({ slug: doc.slug, title, path: basePath,         locale: 'es', collection: 'pages' })
    entries.push({ slug: doc.slug, title, path: `/en${basePath}`, locale: 'en', collection: 'pages' })
  }

  return entries
}

// ─── Fuzzy matching ───────────────────────────────────────────────────────────

/**
 * Encuentra las `top` páginas más similares a `brokenPath` usando
 * Jaro-Winkler sobre el slug y sobre la ruta completa.
 * Filtra al mismo locale que la URL rota para evitar sugerir rutas cruzadas.
 */
function findCandidates(brokenPath: string, index: ContentEntry[], top = 5): Candidate[] {
  const locale = pathLocale(brokenPath)
  // Último segmento significativo de la ruta rota
  const lastSegment = brokenPath.split('/').filter(Boolean).pop() ?? brokenPath

  return index
    .filter(e => e.locale === locale)
    .map(e => ({
      entry: e,
      score: Math.max(
        natural.JaroWinklerDistance(lastSegment, e.slug),
        natural.JaroWinklerDistance(brokenPath, e.path),
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, top)
}

// ─── Redirect helpers ─────────────────────────────────────────────────────────

async function redirectExists(
  payload: Awaited<ReturnType<typeof getPayload>>,
  from: string,
): Promise<boolean> {
  const { totalDocs } = await payload.find({
    collection: 'redirects',
    where: { from: { equals: from } },
    limit: 1,
    depth: 0,
  })
  return totalDocs > 0
}

async function saveRedirect(
  payload: Awaited<ReturnType<typeof getPayload>>,
  from: string,
  to: string,
  dryRun: boolean,
): Promise<void> {
  if (dryRun) {
    console.log(`  ${c.dim}[dry-run]${c.reset}  ${c.bright}${from}${c.reset} ${c.cyan}→${c.reset} ${to}`)
    return
  }
  await payload.create({
    collection: 'redirects',
    data: { from, to: { type: 'custom', url: to } },
  })
  console.log(`  ${c.green}✓${c.reset} Redirect creado: ${c.bright}${from}${c.reset} ${c.cyan}→${c.reset} ${to}`)
}

// ─── Interactive prompt ───────────────────────────────────────────────────────

/** Presenta un menú con las mejores coincidencias y opción de URL personalizada. */
async function promptDestination(
  brokenPath: string,
  candidates: Candidate[],
): Promise<string | null> {
  const { Select, Input } = enquirer as unknown as {
    Select: new(opts: object) => { run(): Promise<string> }
    Input:  new(opts: object) => { run(): Promise<string> }
  }

  const CUSTOM = '__custom__'
  const SKIP   = '__skip__'

  const choices = [
    ...candidates.map(({ entry, score }) => ({
      name:    entry.path,
      message: `${entry.path}  —  "${entry.title}"  (${Math.round(score * 100)}% similar)`,
    })),
    { name: CUSTOM, message: '✏  Escribir URL personalizada' },
    { name: SKIP,   message: '✗  Omitir este enlace' },
  ]

  let selection: string
  try {
    selection = await new Select({
      name:    'destination',
      message: `¿A dónde redirigir "${brokenPath}"?`,
      choices,
    }).run()
  } catch {
    return null // Ctrl+C
  }

  if (selection === SKIP) return null

  if (selection === CUSTOM) {
    try {
      const url = await new Input({
        name:     'url',
        message:  'URL de destino (debe comenzar con /):',
        validate: (v: string) => v.trim().startsWith('/') || 'La URL debe comenzar con /',
      }).run()
      return url.trim() || null
    } catch {
      return null
    }
  }

  return selection
}

// ─── broken-links collection sync ────────────────────────────────────────────

async function syncBrokenLinksCollection(
  payload:   Awaited<ReturnType<typeof getPayload>>,
  broken:    typeof results.links,
  siteUrl:   string,
): Promise<void> {
  for (const link of broken) {
    const existing = await payload.find({
      collection: 'broken-links',
      where: {
        and: [
          { url:        { equals: link.url    } },
          { sourcePage: { equals: link.parent } },
        ],
      },
      limit: 1,
    })

    const data = {
      url:         link.url   || 'Desconocida',
      statusCode:  link.status ?? 0,
      statusText:  (link as { statusText?: string }).statusText ?? 'Error de conexión',
      sourcePage:  link.parent ?? siteUrl,
      lastChecked: new Date().toISOString(),
    }

    if (existing.totalDocs > 0) {
      await payload.update({ collection: 'broken-links', id: existing.docs[0]!.id, data })
    } else {
      await payload.create({ collection: 'broken-links', data })
    }
  }
}

// TypeScript needs the type for the scanner results
let results: Awaited<ReturnType<InstanceType<typeof LinkChecker>['check']>>

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs()

  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printHelp()
    process.exit(0)
  }

  // Header
  console.log(`\n${c.cyan}${c.bright}🔗 Auditoría técnica de enlaces${c.reset}`)
  if (args.createRedirects) {
    const mode = args.auto ? `automático (min-score: ${args.minScore})` : 'interactivo'
    console.log(`${c.magenta}↳ Creación de redirects: ${c.bright}${mode}${c.reset}`)
  }
  if (args.dryRun) console.log(`${c.yellow}💡 Dry-run — no se modificará nada en el CMS${c.reset}`)
  console.log()

  const payload = await getPayload({ config })
  const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

  // Build content index only if we'll need fuzzy matching
  let contentIndex: ContentEntry[] = []
  if (args.createRedirects) {
    process.stdout.write('📚 Construyendo índice de contenido... ')
    contentIndex = await buildContentIndex(payload)
    console.log(`${c.green}${contentIndex.length / 2} documentos indexados${c.reset}`)
  }

  // Scan
  console.log(`🔍 Escaneando ${siteUrl}...`)
  const checker = new LinkChecker()
  results = await checker.check({
    path:        siteUrl,
    recurse:     true,
    concurrency: 10,
    timeout:     5000,
    linksToSkip: [
      'https://www.linkedin.com',
      'https://twitter.com',
    ],
  })

  const broken         = results.links.filter(l => l.state === 'BROKEN')
  const internalBroken = broken.filter(l =>  isInternal(l.url ?? '', siteUrl))
  const externalBroken = broken.filter(l => !isInternal(l.url ?? '', siteUrl))

  console.log(`\n${c.bright}Resultado del escaneo:${c.reset}`)
  console.log(`  Rotos (total):   ${c.red}${broken.length}${c.reset}`)
  console.log(`  Internos:        ${c.yellow}${internalBroken.length}${c.reset}`)
  console.log(`  Externos:        ${c.dim}${externalBroken.length}${c.reset}`)

  if (externalBroken.length > 0) {
    console.log(`\n${c.dim}  Enlaces externos rotos:${c.reset}`)
    for (const l of externalBroken) {
      console.log(`  ${c.dim}${l.status ?? '???'}  ${l.url}${c.reset}`)
    }
  }

  // Persist to broken-links collection
  if (broken.length > 0) {
    console.log(`\n💾 Sincronizando colección broken-links...`)
    await syncBrokenLinksCollection(payload, broken, siteUrl)
    console.log(`  ${c.green}✓${c.reset} ${broken.length} registros actualizados`)
  }

  // ── Redirect creation ──────────────────────────────────────────────────────

  if (!args.createRedirects) {
    if (internalBroken.length > 0) {
      console.log(
        `\n${c.yellow}💡 Tip:${c.reset} Usa ${c.bright}--create-redirects${c.reset} (o ${c.bright}--fix${c.reset}) para crear redirects automáticamente.`,
      )
    }
    console.log(`\n${c.green}✨ Auditoría completada.${c.reset}\n`)
    process.exit(0)
  }

  if (internalBroken.length === 0) {
    console.log(`\n${c.green}✅ No hay enlaces internos rotos que redirigir.${c.reset}\n`)
    process.exit(0)
  }

  console.log(
    `\n${c.cyan}${c.bright}🔀 Procesando redirects — ${internalBroken.length} enlace(s) interno(s) roto(s)${c.reset}\n`,
  )

  let created     = 0
  let skipped     = 0
  let alreadyExists = 0

  for (const link of internalBroken) {
    const brokenPath = extractPath(link.url ?? '', siteUrl)
    if (!brokenPath) { skipped++; continue }

    // Check for existing redirect
    if (await redirectExists(payload, brokenPath)) {
      console.log(`${c.dim}⚡ Ya existe redirect para ${brokenPath}${c.reset}`)
      alreadyExists++
      continue
    }

    const candidates = findCandidates(brokenPath, contentIndex)
    const best = candidates[0]

    // Print the broken link header
    console.log(
      `${c.red}✗${c.reset} ${c.bright}${brokenPath}${c.reset}` +
      `  ${c.dim}[HTTP ${link.status ?? '???'}]  ← ${link.parent}${c.reset}`,
    )
    if (best) {
      console.log(
        `  Mejor coincidencia: ${c.cyan}${best.entry.path}${c.reset}` +
        `  ${c.dim}"${best.entry.title}"  (${Math.round(best.score * 100)}%)${c.reset}`,
      )
    }

    let destination: string | null = null

    if (args.auto) {
      if (best && best.score >= args.minScore) {
        destination = best.entry.path
        console.log(`  ${c.green}✦ Auto-seleccionado:${c.reset} ${destination}`)
      } else {
        const pct = best ? `${Math.round(best.score * 100)}%` : 'sin coincidencias'
        console.log(`  ${c.yellow}⚠ Score insuficiente (${pct} < ${Math.round(args.minScore * 100)}%) → omitiendo${c.reset}`)
        console.log(`  ${c.dim}Tip: reduce --min-score o usa el modo interactivo${c.reset}`)
        skipped++
        continue
      }
    } else {
      destination = await promptDestination(brokenPath, candidates)
    }

    if (!destination) {
      console.log(`  ${c.dim}↳ Omitido${c.reset}`)
      skipped++
      console.log()
      continue
    }

    await saveRedirect(payload, brokenPath, destination, args.dryRun)
    if (!args.dryRun) created++
    console.log()
  }

  // Summary
  const separator = '─'.repeat(44)
  console.log(`\n${c.cyan}${c.bright}${separator}${c.reset}`)
  if (args.dryRun) {
    console.log(`  Redirects propuestos:  ${internalBroken.length - skipped - alreadyExists}`)
  } else {
    console.log(`  ${c.green}Redirects creados:${c.reset}    ${created}`)
  }
  console.log(`  ${c.dim}Ya existían:${c.reset}          ${alreadyExists}`)
  console.log(`  ${c.dim}Omitidos:${c.reset}             ${skipped}`)

  if (created > 0 && !args.dryRun) {
    console.log(
      `\n${c.yellow}⚠ Ejecuta ${c.bright}pnpm redirects${c.reset}${c.yellow} para regenerar redirects.json y aplicar los cambios.${c.reset}`,
    )
  }

  console.log(`\n${c.green}✨ Auditoría completada.${c.reset}\n`)
  process.exit(0)
}

main().catch(err => {
  console.error('❌ Fallo en la auditoría de enlaces:', err)
  process.exit(1)
})
