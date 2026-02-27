/**
 * Script Registry — fuente de verdad para el TUI de utilidades.
 *
 * Exporta los tipos, el registro de scripts, las categorías y la función
 * buildCommand, de forma que el TUI y los tests los compartan sin duplicación.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ParamType = 'flag' | 'string' | 'number' | 'select' | 'positional'

/**
 * - 'subcommand': el valor se inserta justo después del path del script (ej. `status`, `push`)
 * - 'space':      `--key valor` (dos elementos en argv)
 * - 'equals':     `--key=valor` (un solo elemento en argv)
 */
export type ArgFormat = 'space' | 'equals' | 'subcommand'

export interface SelectOption {
  value: string
  label: string
  hint?: string
}

export interface Param {
  name: string
  /** Flag CLI, ej. '--dry-run'. Cadena vacía para subcommands y positionales. */
  key: string
  type: ParamType
  required: boolean
  description: string
  default?: string | number | boolean
  options?: SelectOption[]
  placeholder?: string
  /** Formato de serialización en el comando resultante. Por defecto 'space'. */
  format?: ArgFormat
  validate?: (v: string | undefined) => string | undefined
}

export interface Script {
  id: string
  name: string
  category: string
  /** Descripción corta usada en la lista de selección. */
  description: string
  /** Descripción larga mostrada en la vista de detalle. */
  longDescription: string
  /** Comando base, ej. 'tsx -r dotenv/config src/scripts/syncContent.ts' */
  baseCommand: string
  params: Param[]
  examples?: string[]
}

export interface CommandSpec {
  /** Cadena lista para mostrar en la terminal (con comillas donde sea necesario). */
  display: string
  /** Ejecutable, ej. 'tsx' */
  bin: string
  /** Resto de argumentos para spawn (cada elemento es un argv separado). */
  args: string[]
}

// ─── Categories ───────────────────────────────────────────────────────────────

export const CATEGORIES: Record<string, { label: string; hint: string }> = {
  content: { label: '📝  Content', hint: 'Sincronización de contenido y keywords' },
  seo: { label: '🔍  SEO', hint: 'Métricas, enlaces internos y auditorías' },
  maintenance: { label: '🔧  Mantenimiento', hint: 'Correcciones y utilidades del sistema' },
}

// ─── Script Registry ──────────────────────────────────────────────────────────

export const SCRIPTS: Script[] = [
  // ── CONTENT ──────────────────────────────────────────────────────────────────

  {
    id: 'sync-content',
    name: 'Sync Content',
    category: 'content',
    description: 'Sincroniza archivos Markdown ↔ Payload CMS (bidireccional)',
    longDescription:
      'Sincroniza los archivos Markdown de content/posts/ con la base de datos de Payload CMS. ' +
      'Detecta conflictos, permite sync parcial por archivo y maneja contenido bilingüe (es/en).',
    baseCommand: 'tsx -r dotenv/config src/scripts/syncContent.ts',
    params: [
      {
        name: 'Operación',
        key: '',
        type: 'select',
        required: true,
        description: 'Acción a realizar',
        format: 'subcommand',
        options: [
          { value: 'status', label: 'status', hint: 'Ver diferencias local vs. remoto' },
          { value: 'push', label: 'push', hint: 'Subir cambios locales al CMS' },
          { value: 'pull', label: 'pull', hint: 'Bajar cambios del CMS a local' },
          { value: 'fetch', label: 'fetch', hint: 'Ver cambios remotos sin aplicar' },
        ],
      },
      {
        name: '--force',
        key: '--force',
        type: 'flag',
        required: false,
        description: 'Sobreescribir remoto aunque haya conflictos (solo push)',
        default: false,
      },
      {
        name: '--post',
        key: '--post',
        type: 'string',
        required: false,
        description: 'Sincronizar solo este archivo (solo push, ej: mi-articulo.md)',
        placeholder: 'mi-articulo.md',
        format: 'equals',
      },
    ],
    examples: [
      'pnpm sync status',
      'pnpm sync push --force',
      'pnpm sync push --post=articulo.md',
    ],
  },

  {
    id: 'sync-keywords',
    name: 'Sync Keywords',
    category: 'content',
    description: 'Sincroniza content/keywords.md → colección keyword-metrics',
    longDescription:
      'Lee la tabla de keywords en content/keywords.md y la sincroniza con la colección ' +
      'keyword-metrics de Payload. Opcionalmente enriquece datos con SERP en vivo via SerpAPI ' +
      '(volumen, dificultad, PAA, AI Overview).',
    baseCommand: 'tsx -r dotenv/config src/scripts/syncKeywords.ts',
    params: [
      {
        name: '--fetch-serp',
        key: '--fetch-serp',
        type: 'flag',
        required: false,
        description: 'Obtener métricas SERP en vivo via SerpAPI (requiere SERPAPI_KEY en .env)',
        default: false,
      },
      {
        name: '--verbose',
        key: '--verbose',
        type: 'flag',
        required: false,
        description: 'Mostrar logs detallados del procesamiento',
        default: false,
      },
    ],
    examples: ['pnpm sync:keywords', 'pnpm sync:keywords --fetch-serp --verbose'],
  },

  // ── SEO ──────────────────────────────────────────────────────────────────────

  {
    id: 'build-internal-links',
    name: 'Build Internal Links',
    category: 'seo',
    description: 'Automatiza enlaces internos y topic clusters (pillar/satellite)',
    longDescription:
      'Genera y aplica enlaces internos entre posts basándose en topic clusters (pillar/satellite) ' +
      'y coincidencias de keywords. Puede clasificar posts, construir el mapa de clusters y ' +
      'mostrar un reporte de salud del cluster. Respeta el aislamiento de locale (es/en).',
    baseCommand: 'tsx -r dotenv/config src/scripts/build-internal-links.ts',
    params: [
      {
        name: '--dry-run',
        key: '--dry-run',
        type: 'flag',
        required: false,
        description: 'Previsualizar cambios sin modificar ningún archivo',
        default: false,
      },
      {
        name: '--classify',
        key: '--classify',
        type: 'flag',
        required: false,
        description: 'Etiquetar posts sin contentRole (pillar/satellite/standalone)',
        default: false,
      },
      {
        name: '--cluster-only',
        key: '--cluster-only',
        type: 'flag',
        required: false,
        description: 'Solo aplicar enlaces estructurales pillar↔satellite, sin escaneo de keywords',
        default: false,
      },
      {
        name: '--locale',
        key: '--locale',
        type: 'select',
        required: false,
        description: 'Procesar solo posts de este idioma',
        format: 'space',
        options: [
          { value: '', label: 'Todos (sin filtro)' },
          { value: 'es', label: 'es', hint: 'Solo posts en español' },
          { value: 'en', label: 'en', hint: 'Solo posts en inglés' },
        ],
        default: '',
      },
      {
        name: '--category',
        key: '--category',
        type: 'string',
        required: false,
        description: 'Procesar solo posts de esta categoría slug (ej: tech-seo)',
        placeholder: 'tech-seo',
        format: 'space',
      },
      {
        name: '--max-links',
        key: '--max-links',
        type: 'number',
        required: false,
        description: 'Máximo de enlaces keyword por post',
        default: 3,
        placeholder: '3',
        format: 'space',
        validate: (v) => {
          if (!v || v === '') return undefined
          if (isNaN(Number(v)) || Number(v) < 1) return 'Debe ser un número mayor a 0'
        },
      },
      {
        name: '--verbose',
        key: '--verbose',
        type: 'flag',
        required: false,
        description: 'Mostrar logs detallados durante el procesamiento',
        default: false,
      },
      {
        name: '--yes',
        key: '--yes',
        type: 'flag',
        required: false,
        description: 'Omitir confirmación interactiva antes de aplicar cambios',
        default: false,
      },
    ],
    examples: [
      'tsx src/scripts/build-internal-links.ts --classify --dry-run',
      'tsx src/scripts/build-internal-links.ts --cluster-only',
      'tsx src/scripts/build-internal-links.ts --locale es --dry-run',
      'tsx src/scripts/build-internal-links.ts --max-links 5 --yes',
    ],
  },

  {
    id: 'update-seo-metrics',
    name: 'Update SEO Metrics',
    category: 'seo',
    description: 'Actualiza métricas SERP, crawlea competidores y calcula oportunidades SEO',
    longDescription:
      'Interfaz interactiva multi-select para elegir keywords. Obtiene métricas SERP ' +
      '(volumen, dificultad, PAA, AI Overview) y crawlea hasta 4 URLs competidoras para ' +
      'extraer headings, conteo de palabras y puntuación de citabilidad SGE.',
    baseCommand: 'tsx -r dotenv/config src/scripts/update-seo-metrics.ts',
    params: [
      {
        name: '--source',
        key: '--source',
        type: 'select',
        required: false,
        description: 'Fuente de datos SERP a usar',
        format: 'equals',
        options: [
          { value: 'serpapi', label: 'serpapi', hint: 'SerpAPI (recomendado, requiere SERPAPI_KEY)' },
          { value: 'dataforseo', label: 'dataforseo', hint: 'DataForSEO API' },
          { value: 'google-ads', label: 'google-ads', hint: 'Google Ads Keyword Planner API' },
          { value: 'mock', label: 'mock', hint: 'Datos de prueba sin necesidad de API' },
        ],
        default: 'serpapi',
      },
      {
        name: '--analyze-gap',
        key: '--analyze-gap',
        type: 'flag',
        required: false,
        description: 'Descubrir y registrar keyword gaps de búsquedas relacionadas',
        default: false,
      },
      {
        name: '--all',
        key: '--all',
        type: 'flag',
        required: false,
        description: 'Procesar todas las keywords sin selección interactiva',
        default: false,
      },
    ],
    examples: [
      'tsx src/scripts/update-seo-metrics.ts',
      'tsx src/scripts/update-seo-metrics.ts --source=serpapi --analyze-gap',
      'tsx src/scripts/update-seo-metrics.ts --all',
    ],
  },

  {
    id: 'search-keyword',
    name: 'Search Keyword',
    category: 'seo',
    description: 'Busca una keyword en keywords.md y muestra su registro completo',
    longDescription:
      'Busca una keyword específica en la tabla de content/keywords.md (case-insensitive) y ' +
      'muestra todos sus campos con mapeo dinámico de columnas. ' +
      'Sugiere keywords similares si no hay coincidencia exacta.',
    baseCommand: 'tsx src/scripts/search-keyword.ts',
    params: [
      {
        name: 'keyword',
        key: '',
        type: 'positional',
        required: true,
        description: 'Keyword a buscar (case-insensitive)',
        placeholder: 'technical seo',
        format: 'subcommand',
      },
    ],
    examples: [
      'tsx src/scripts/search-keyword.ts "technical seo"',
      'tsx src/scripts/search-keyword.ts "guía seo"',
    ],
  },

  {
    id: 'check-links',
    name: 'Check Links (Broken Links)',
    category: 'seo',
    description: 'Crawlea el sitio buscando enlaces rotos y opcionalmente crea redirects',
    longDescription:
      'Crawlea el sitio de forma recursiva (10 conexiones simultáneas) detectando enlaces ' +
      'rotos (4xx/5xx). Almacena resultados en broken-links de Payload CMS. ' +
      'Con --create-redirects (alias --fix) crea redirects en el CMS usando fuzzy matching ' +
      'Jaro-Winkler para sugerir destinos. Modo interactivo o automático (--auto). ' +
      'Requiere NEXT_PUBLIC_SERVER_URL en .env.',
    baseCommand: 'tsx -r dotenv/config src/scripts/seo/check-links.ts',
    params: [
      {
        name: '--create-redirects',
        key: '--create-redirects',
        type: 'flag',
        required: false,
        description: 'Crear redirects en el CMS para los enlaces internos rotos (alias: --fix)',
        default: false,
      },
      {
        name: '--auto',
        key: '--auto',
        type: 'flag',
        required: false,
        description: 'Seleccionar automáticamente la mejor coincidencia (modo no interactivo)',
        default: false,
      },
      {
        name: '--dry-run',
        key: '--dry-run',
        type: 'flag',
        required: false,
        description: 'Mostrar qué redirects se crearían sin modificar el CMS',
        default: false,
      },
      {
        name: '--min-score',
        key: '--min-score',
        type: 'number',
        required: false,
        description: 'Umbral de similitud mínima para aceptar una coincidencia en modo --auto (0–1)',
        default: 0.72,
        placeholder: '0.72',
        format: 'equals',
        validate: (v) => {
          if (!v || v === '') return undefined
          const n = Number(v)
          if (isNaN(n) || n < 0 || n > 1) return 'Debe ser un número entre 0 y 1'
        },
      },
    ],
    examples: [
      'tsx src/scripts/seo/check-links.ts',
      'tsx src/scripts/seo/check-links.ts --create-redirects',
      'tsx src/scripts/seo/check-links.ts --fix --auto --dry-run',
      'tsx src/scripts/seo/check-links.ts --fix --auto --min-score=0.8',
    ],
  },

  {
    id: 'sync-gsc',
    name: 'Sync GSC (Google Search Console)',
    category: 'seo',
    description: 'Importa datos de rendimiento de GSC y los agrega a keyword-metrics',
    longDescription:
      'Obtiene datos de rendimiento de Google Search Console (últimos 10 días) e inspecciona ' +
      'las 50 páginas principales para detectar problemas de indexación. Agrega clicks, ' +
      'impresiones, posición promedio y CTR a keyword-metrics. Requiere GSC_* en .env.',
    baseCommand: 'tsx -r dotenv/config src/scripts/seo/sync-gsc.ts',
    params: [],
    examples: ['pnpm run sync:gsc'],
  },

  {
    id: 'update-cwv',
    name: 'Update Core Web Vitals',
    category: 'seo',
    description: 'Obtiene métricas PageSpeed Insights para todas las URLs del sitemap',
    longDescription:
      'Consulta Google PageSpeed Insights API para cada URL del sitemap y almacena métricas ' +
      'Core Web Vitals (LCP, FCP, INP, CLS, performance score). Prioriza datos de campo ' +
      '(usuarios reales). Reescanea semanalmente o con --force. Rate limit: 2s entre requests.',
    baseCommand: 'tsx -r dotenv/config src/scripts/seo/update-cwv.ts',
    params: [
      {
        name: '--force',
        key: '--force',
        type: 'flag',
        required: false,
        description: 'Reescanear todas las URLs ignorando la fecha del último scan',
        default: false,
      },
    ],
    examples: [
      'tsx src/scripts/seo/update-cwv.ts',
      'tsx src/scripts/seo/update-cwv.ts --force',
    ],
  },

  // ── MAINTENANCE ───────────────────────────────────────────────────────────────

  {
    id: 'fix-internal-links',
    name: 'Fix Internal Links',
    category: 'maintenance',
    description: 'Migra enlaces Markdown relativos a URLs absolutas en content/posts/',
    longDescription:
      'Escanea todos los archivos .md en content/posts/ y convierte los enlaces relativos ' +
      '([texto](/ruta)) a URLs absolutas (https://juan-tech.com/blog/ruta). ' +
      'Omite enlaces ya absolutos y los que ya comienzan con /blog/.',
    baseCommand: 'tsx src/scripts/fix-internal-links.ts',
    params: [
      {
        name: '--dry-run',
        key: '--dry-run',
        type: 'flag',
        required: false,
        description: 'Previsualizar qué archivos cambiarían sin modificar ninguno',
        default: false,
      },
    ],
    examples: [
      'tsx src/scripts/fix-internal-links.ts --dry-run',
      'tsx src/scripts/fix-internal-links.ts',
    ],
  },

  {
    id: 'fetch-redirects',
    name: 'Fetch Redirects',
    category: 'maintenance',
    description: 'Exporta redirects del CMS a redirects.json resolviendo cadenas',
    longDescription:
      'Obtiene todos los redirects de Payload CMS, resuelve cadenas de redirección ' +
      '(A→B→C se convierte en A→C), detecta loops infinitos y exporta el JSON ' +
      'optimizado para Next.js. Se ejecuta automáticamente en pnpm build y pnpm dev.',
    baseCommand: 'tsx -r dotenv/config src/scripts/fetch-redirects.ts',
    params: [],
    examples: ['tsx src/scripts/fetch-redirects.ts'],
  },

  {
    id: 'delete-loop-redirects',
    name: 'Delete Loop Redirects',
    category: 'maintenance',
    description: 'Detecta y elimina redirects con cadenas circulares del CMS',
    longDescription:
      'Analiza todos los redirects buscando cadenas circulares (hasta profundidad 50) y ' +
      'elimina los registros problemáticos directamente de Payload CMS. ' +
      'Muestra los loops detectados antes de borrar. Sin loops: no hace nada.',
    baseCommand: 'tsx -r dotenv/config src/scripts/delete-loop-redirects.ts',
    params: [],
    examples: ['tsx src/scripts/delete-loop-redirects.ts'],
  },

  {
    id: 'fix-user-slugs',
    name: 'Fix User Slugs',
    category: 'maintenance',
    description: 'Genera slugs faltantes para documentos de User en Payload',
    longDescription:
      'Busca usuarios de Payload sin slug (o con slug vacío) y genera uno automáticamente ' +
      'a partir del campo name (minúsculas, sin caracteres especiales, guiones en espacios). ' +
      'Procesa hasta 1000 usuarios por ejecución.',
    baseCommand: 'tsx -r dotenv/config src/scripts/fix-user-slugs.ts',
    params: [],
    examples: ['tsx src/scripts/fix-user-slugs.ts'],
  },

  {
    id: 'debug-content',
    name: 'Debug Content',
    category: 'maintenance',
    description: 'Lista primeros 10 docs por colección para verificar conexión con el CMS',
    longDescription:
      'Herramienta de diagnóstico: lista los primeros 10 Pages, Posts y Case Studies ' +
      '(con estado draft/published) y muestra el conteo total por colección. ' +
      'Útil para verificar que la conexión con MongoDB y Payload funciona correctamente.',
    baseCommand: 'tsx -r dotenv/config src/scripts/debug-content.ts',
    params: [],
    examples: ['tsx src/scripts/debug-content.ts'],
  },

  {
    id: 'test-email',
    name: 'Test Email',
    category: 'maintenance',
    description: 'Envía un email de prueba para verificar la integración con Resend',
    longDescription:
      'Prueba la entrega de emails via Resend configurado en Payload CMS. ' +
      'Envía un email HTML de prueba a la dirección en EMAIL_FROM. ' +
      'Útil para verificar RESEND_SECRET y la configuración de email transaccional.',
    baseCommand: 'tsx -r dotenv/config src/scripts/test-email.ts',
    params: [],
    examples: ['tsx src/scripts/test-email.ts'],
  },
]

// ─── buildCommand ─────────────────────────────────────────────────────────────

/**
 * Construye el CommandSpec (bin + args array + cadena para display) a partir de un
 * script y los valores capturados en el formulario de parámetros.
 *
 * Reglas de serialización:
 *   - 'subcommand': el valor se inserta justo después de los args base (ej. 'push')
 *   - 'equals':     `--key=valor`  — se omite si el valor coincide con el default
 *   - 'space':      `--key valor`  — se omite si el valor coincide con el default
 *   - 'flag':       sólo se añade cuando es `true`
 *   - positional:   se añade directamente al final (tras subcommands)
 *
 * Los valores vacíos (`''`, `false`, `undefined`) siempre se omiten.
 * Las cadenas con espacios se envuelven entre comillas solo en el `display`.
 */
export function buildCommand(script: Script, values: Record<string, unknown>): CommandSpec {
  const baseParts = script.baseCommand.split(' ')
  const bin = baseParts[0]!
  const args: string[] = baseParts.slice(1)

  // 1. Subcommands y args posicionales (se insertan ANTES de los flags)
  for (const param of script.params) {
    const isSubcmd = param.format === 'subcommand' || (param.key === '' && param.type !== 'positional')
    const isPositional = param.type === 'positional' && param.key === ''
    if (!isSubcmd && !isPositional) continue

    const value = values[param.name]
    if (value !== undefined && value !== '') {
      args.push(String(value))
    }
  }

  // 2. Flags y params con clave
  for (const param of script.params) {
    if (param.format === 'subcommand' || (param.key === '' && param.type !== 'flag')) continue
    if (param.type === 'positional') continue

    const value = values[param.name]
    if (value === undefined || value === false || value === '') continue

    if (param.type === 'flag') {
      if (value === true) args.push(param.key)
    } else if (param.format === 'equals') {
      if (value !== param.default) args.push(`${param.key}=${String(value)}`)
    } else {
      // 'space' (default) — omite si el valor es igual al default
      if (value !== param.default) {
        args.push(param.key)
        args.push(String(value))
      }
    }
  }

  // Construye el string de display envolviendo en comillas los valores con espacios
  const displayArgs = args.map((a) => (a.includes(' ') ? `"${a}"` : a))
  const display = [bin, ...displayArgs].join(' ')

  return { bin, args, display }
}
