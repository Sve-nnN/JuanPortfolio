import * as p from '@clack/prompts'
import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { JSDOM } from 'jsdom'
import {
  randomStr,
  randomPassword,
  loadState,
  saveState,
  type DinoRankState,
  type DinoRankAccount,
} from './create-post'
import { loadRegistry, saveRegistry, addKeywordToAccount, updateAccount, deleteAccount, registerAccount } from './utils/accountRegistry'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '../..')

const KEYWORDS_FILE = join(ROOT, 'content/keywords.md')
const CACHE_FILE = join(ROOT, 'content/dinorank-kw-cache.json')
const KW_HISTORY_FILE = join(ROOT, 'content/dinorank-kw-history.json')
const KW_SESSION_FILE = join(ROOT, 'content/dinorank-kw-session.json')
const LOGS_DIR = join(ROOT, 'logs')
const LOG_FILE = join(LOGS_DIR, 'scrape-dinorank.log')

export interface KWCacheEntry {
  keyword: string; country: string; volume: string; competency: string; cpc: string;
  trend: number[]; relatedSearches: string; timestamp: string;
}

export interface KWHistoryEntry extends KWCacheEntry {
  fromDinoRankHistory: boolean
}

export interface KWCache { [key: string]: KWCacheEntry }

interface ArgResult {
  keywords: string[]
  country: string
  debug: boolean
  useAI: boolean
}

// ─── Logger ───────────────────────────────────────────────────────────────────

function log(level: 'info' | 'warn' | 'error', step: string, msg: string, data?: unknown): void {
  try {
    if (!existsSync(LOGS_DIR)) mkdirSync(LOGS_DIR, { recursive: true })
    const entry = JSON.stringify({ ts: new Date().toISOString(), level, step, msg, ...(data !== undefined ? { data } : {}) })
    appendFileSync(LOG_FILE, entry + '\n', 'utf-8')
  } catch {}
}

// ─── Args ─────────────────────────────────────────────────────────────────────

function resolveArgs(): ArgResult | null {
  const argv = process.argv.slice(2)
  let debug = false, country = 'es', useAI = false
  let keywords: string[] = []

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!
    if (arg === '--debug') { debug = true }
    else if (arg === '--ai') { useAI = true }
    else if (arg.startsWith('--country=')) { country = arg.slice('--country='.length) }
    else if (arg === '--country' && argv[i + 1]) { country = argv[++i]! }
    else if (!arg.startsWith('--')) {
      keywords = keywords.concat(arg.split(',').map(s => s.trim()).filter(Boolean))
    }
  }

  if (keywords.length === 0) return null
  return { keywords, country, debug, useAI }
}

// ─── History ──────────────────────────────────────────────────────────────────

function loadHistory(): KWHistoryEntry[] {
  if (!existsSync(KW_HISTORY_FILE)) return []
  try { return JSON.parse(readFileSync(KW_HISTORY_FILE, 'utf-8')) as KWHistoryEntry[] } catch { return [] }
}

// ─── Custom Errors ───────────────────────────────────────────────────────────

export class DeviceConflictError extends Error {
  constructor(public readonly email: string) {
    super(`Sesión simultánea detectada — cuenta: ${email}`)
    this.name = 'DeviceConflictError'
  }
}

export class NoCreditsError extends Error {
  constructor(public readonly email: string) {
    super(`Sin créditos de KW Research — cuenta: ${email}`)
    this.name = 'NoCreditsError'
  }
}

// ─── DinoRank API Client ─────────────────────────────────────────────────────

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'

class DinoRankApiClient {
  private cookies: string = ''

  constructor(public email: string, public pass: string) {}

  private getSetCookies(response: Response): string[] {
    const h = response.headers as unknown as { getSetCookie?: () => string[] }
    if (typeof h.getSetCookie === 'function') return h.getSetCookie()
    const raw = response.headers.get('set-cookie')
    return raw ? [raw] : []
  }

  private mergeCookies(raw: string[]): void {
    const map = new Map<string, string>()
    if (this.cookies) {
      this.cookies.split(';').forEach(c => {
        const idx = c.indexOf('=')
        if (idx > 0) map.set(c.slice(0, idx).trim(), c.slice(idx + 1).trim())
      })
    }
    for (const cookie of raw) {
      const kv = cookie.split(';')[0]?.trim()
      if (!kv) continue
      const idx = kv.indexOf('=')
      if (idx > 0) map.set(kv.slice(0, idx).trim(), kv.slice(idx + 1).trim())
    }
    this.cookies = Array.from(map.entries()).map(([k, v]) => `${k}=${v}`).join('; ')
  }

  private commonHeaders(referer: string): Record<string, string> {
    return {
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Origin': 'https://dinorank.com',
      'Referer': referer,
      'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent': UA,
      'X-Requested-With': 'XMLHttpRequest',
      'Cookie': this.cookies,
    }
  }

  private async post(url: string, body: string, referer: string): Promise<string> {
    const res = await fetch(url, { method: 'POST', headers: this.commonHeaders(referer), body })
    this.mergeCookies(this.getSetCookies(res))
    return res.text()
  }

  private async get(url: string, referer: string = url): Promise<string> {
    const res = await fetch(url, {
      headers: { ...this.commonHeaders(referer), 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8' },
    })
    this.mergeCookies(this.getSetCookies(res))
    return res.text()
  }

  async logout(): Promise<void> {
    try {
      const body = `t=${Date.now()}`
      await this.post(
        'https://dinorank.com/ajax/cierra.php',
        body,
        'https://dinorank.com/keyword-research/',
      )
    } catch {}
  }

  async login(language: string = 'es'): Promise<'ok' | 'device_conflict' | 'failed'> {
    const isEn = language === 'en'
    const loginUrl = `https://dinorank.com/${isEn ? 'en/' : ''}login/`
    const homedUrl = `https://dinorank.com/${isEn ? 'en/' : ''}homed/`

    // 1. Initial hit to get PHPSESSID and CSRF
    const initRes = await fetch(loginUrl, { headers: { 'User-Agent': UA } })
    this.mergeCookies(this.getSetCookies(initRes))

    // 2. Perform login POST
    const body = `nombreUsuario=${encodeURIComponent(this.email)}&clave=${encodeURIComponent(this.pass)}&permanecer=si&elemento=&tiempo=${Date.now()}`
    const html = await this.post('https://dinorank.com/ajax/login.php', body, loginUrl)

    if (html.includes('status":"activo"')) {
      // 3. Immediate GET to /homed/ with navigation headers
      await fetch(homedUrl, {
        headers: {
          'Cookie': this.cookies,
          'User-Agent': UA,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
          'Referer': loginUrl,
          'Sec-Ch-Ua': '"Chromium";v="145", "Not:A-Brand";v="99"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"macOS"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
        }
      }).then(async res => {
        this.mergeCookies(this.getSetCookies(res))
      })

      // 4. Initialize research session
      const researchUrl = `https://dinorank.com/${isEn ? 'en/' : ''}keyword-research/`
      await this.get(researchUrl, homedUrl)
      
      return 'ok'
    }
    
    if (html.includes('dispositivo') || html.includes('device') || html.includes('otro')) {
      return 'device_conflict'
    }
    
    return 'failed'
  }

  private parseKresearchResponse(raw: string): { status: string; message: string; keyword_vol: number | null; total_results: number } | null {
    const idx = raw.lastIndexOf('{"status":"OK",')
    if (idx === -1) {
      if (raw.includes('status":"ERROR"') || raw.includes('error')) {
        console.warn(`[DinoRank] Response error: ${raw.slice(0, 200)}...`)
      }
      return null
    }
    try {
      return JSON.parse(raw.slice(idx))
    } catch (e) {
      console.error(`[DinoRank] JSON Parse Error. Raw tail: ${raw.slice(-100)}`)
      return null
    }
  }

  private getLongLanguageName(lang: string): string {
    const mapping: Record<string, string> = {
      es: 'Spanish, Spain',
      en: 'English',
    }
    return mapping[lang] || 'Spanish, Spain'
  }

  async search(keyword: string, country: string = 'MX', language: string = 'es'): Promise<KWCacheEntry[]> {
    const bodySearch = `keyword=${encodeURIComponent(keyword)}&analisis_id=&keyword_pais=${country.toUpperCase()}&keyword_idioma=${language}&grupokeywordbuscar=&grupokeywordocultar=&desdeotrakeyword=&orden=&filtro=&volumendesdekr=&volumenhastakr=&incluirkrinput=&excluirkrinput=&cpcdesdekr=&cpchastakr=`
    const referer = `https://dinorank.com/${language === 'en' ? 'en/' : ''}/keyword-research/`
    let html = ''

    for (let i = 0; i < 12; i++) {
      const raw = await this.post('https://dinorank.com/ajax/kresearch.php', bodySearch, referer)
      const parsed = this.parseKresearchResponse(raw)
      
      if (!parsed) {
        if (raw.includes('cr\u00e9ditos') || raw.includes('agotado')) {
          throw new NoCreditsError(this.email)
        }
        // If we get an invalid response, let's wait a bit longer, could be a temporary block
        await new Promise(r => setTimeout(r, 3000))
        continue
      }
      
      if (parsed.total_results > 0 && parsed.message) {
        html = parsed.message
        // ─── Immediate Tracking Request ───
        const longLang = this.getLongLanguageName(language)
        const trackBody = `keyword=${encodeURIComponent(keyword)}&keyword_pais=${country.toUpperCase()}&keyword_idioma=${encodeURIComponent(longLang)}`
        await this.post('https://dinorank.com/ajax/kresearchTrackeo.php', trackBody, referer)
        break
      }
      
      if (parsed.status === 'OK' && parsed.total_results === 0) {
        return []
      }

      if (i < 11) await new Promise<void>(r => setTimeout(r, 3000))
    }

    return html ? this.parseTable(html, country) : []
  }

  async getSuggestions(keyword: string, country: string = 'MX', language: string = 'es'): Promise<KWCacheEntry[]> {
    const body = `keyword=${encodeURIComponent(keyword)}&keyword_pais=${country.toUpperCase()}&keyword_idioma=${language}`
    const referer = `https://dinorank.com/${language === 'en' ? 'en/' : ''}/keyword-research/`

    const raw = await this.post('https://dinorank.com/ajax/kresearchIAsimilares.php', body, referer)
    const parsed = this.parseKresearchResponse(raw)

    if (parsed && parsed.total_results > 0 && parsed.message) {
      return this.parseTable(parsed.message, country)
    }
    return []
  }

  async completeOnboarding(): Promise<void> {
    const referer = 'https://dinorank.com/onboarding/'
    const t = Date.now()

    // Step 1: Initial view and profile
    await this.post('https://dinorank.com/views/verOnboardingPasosDetalle.php', `t=${t}&paso=NaN`, referer)
    await this.post('https://dinorank.com/ajax/enviaOnboardingPasosDetalle.php', `t=${t}&idActive=&tipo=ecommerce&como=&que_estas_interesado=&paso=1`, referer)

    // Step 2: How you found us
    await this.post('https://dinorank.com/views/verOnboardingPasosDetalle.php', `t=${t}&paso=1`, referer)
    await this.post('https://dinorank.com/ajax/enviaOnboardingPasosDetalle.php', `t=${t}&idActive=&tipo=&como=redessociales&que_estas_interesado=&paso=2`, referer)

    // Step 3: Interests
    await this.post('https://dinorank.com/views/verOnboardingPasosDetalle.php', `t=${t}&paso=2`, referer)
    const interests = 'auditoria;keywordresearch;SEOlocal;contenido;tracking;backlinks;Analizarcompetencia;'
    await this.post('https://dinorank.com/ajax/enviaOnboardingPasosDetalle.php', `t=${t}&idActive=&tipo=&como=&que_estas_interesado=${encodeURIComponent(interests)}&paso=3`, referer)

    // Step 4: Domain
    await this.post('https://dinorank.com/views/verOnboardingPasosDetalle.php', `t=${t}&paso=3`, referer)
    await this.post('https://dinorank.com/ajax/common/agregaDominio.php', 'dominio=neilpatel.com&pais=MX&idioma=es&tipoproyecto=nicho', referer)
    await this.post('https://dinorank.com/ajax/enviaOnboardingPasosDetalle.php', `t=${t}&idActive=&tipo=&como=&que_estas_interesado=&paso=4`, referer)

    // Step 5: Keyword Tracking
    await this.post('https://dinorank.com/views/verOnboardingPasosDetalle.php', `t=${t}&paso=4`, referer)
    await this.post('https://dinorank.com/ajax/sugerenciasKeywords.php', `t=${t}`, referer)
    await this.post('https://dinorank.com/ajax/tracking/agregarKeyword.php', 'keyword=how+to+start+a+blog&fuente=pc&geoID=0', referer)
    await this.post('https://dinorank.com/ajax/enviaOnboardingPasosDetalle.php', `t=${t}&idActive=&tipo=&como=&que_estas_interesado=&paso=5`, referer)

    // Finalize
    await this.post('https://dinorank.com/views/verOnboardingPasosDetalle.php', `t=${t}&paso=5`, referer)
  }

  private parseTable(html: string, country: string): KWCacheEntry[] {
    const dom = new JSDOM(html)
    const results: KWCacheEntry[] = []
    dom.window.document.querySelectorAll('tr').forEach((row: any) => {
      const cells: any[] = Array.from(row.querySelectorAll('td'))
      if (cells.length < 5) return
      const kw = cells[1]!.textContent?.trim() ?? ''
      const vol = cells[2]!.textContent?.replace(/\D/g, '') ?? '0'
      // th[3]=Competencia, th[4]=CPC (may be "Sin datos")
      const comp = cells[3]!.textContent?.replace(/[^\d,.]/g, '').replace(',', '.') ?? '0'
      const cpc = cells[4]!.textContent?.replace(/[^\d,.]/g, '').replace(',', '.') ?? '0'
      if (kw && kw.length > 1) {
        results.push({ keyword: kw, volume: vol, cpc, competency: comp, country, trend: [], relatedSearches: '', timestamp: new Date().toISOString() })
      }
    })
    return results
  }
}

/** 
 * Creates a new DinoRank account using pure HTTP (no browser).
 * Optimized for speed and reliability.
 */
export async function createDinoRankAccount(): Promise<{ email: string; password: string }> {
  const email = `${randomStr(8)}${randomStr(4)}@gmail.com`
  const password = randomPassword()
  const registerUrl = 'https://dinorank.com/registro/?codPromo=dinoTrial25'
  
  const api = new DinoRankApiClient(email, password)
  
  p.log.info(`Creando cuenta DinoRank: ${email}`)

  // 1. Get initial cookies
  const initRes = await fetch(registerUrl, { headers: { 'User-Agent': UA } })
  const h = initRes.headers as unknown as { getSetCookie?: () => string[] }
  const setCookies = typeof h.getSetCookie === 'function' ? h.getSetCookie() : []
  api['mergeCookies'](setCookies)

  // 2. Perform registration
  const regBody = `email=${encodeURIComponent(email)}&clave=${encodeURIComponent(password)}&elemento=&telefono=%2B34666000000`
  const regRes = await api['post']('https://dinorank.com/ajax/registro1.php', regBody, registerUrl)
  
  if (!regRes.includes('creado satisfactoriamente')) {
    throw new Error(`Error en el registro HTTP: ${regRes.slice(0, 100)}`)
  }

  // 3. Landing and Onboarding initialization
  await api['get']('https://dinorank.com/homed/', registerUrl)
  await api['get']('https://dinorank.com/onboarding/', 'https://dinorank.com/homed/')
  
  // 4. Complete multi-step onboarding
  await api.completeOnboarding()

  p.log.success(`Cuenta creada y onboarding completado: ${email}`)
  return { email, password }
}

// ─── Session ──────────────────────────────────────────────────────────────────

function clearSession(): void {
  if (existsSync(KW_SESSION_FILE)) writeFileSync(KW_SESSION_FILE, '[]')
}

// ─── Scraper Functions ────────────────────────────────────────────────────────

export async function scrapeOnce(
  keywords: string[], 
  country: string, 
  account: DinoRankAccount, 
  language: string = 'es',
  mode: 'research' | 'suggestions' = 'research'
): Promise<KWCacheEntry[]> {
  const api = new DinoRankApiClient(account.email, account.password)
  const loginResult = await api.login(language)
  
  if (loginResult === 'device_conflict') throw new DeviceConflictError(account.email)
  if (loginResult !== 'ok') {
    p.log.warn(`Eliminando cuenta fallida: ${account.email}`)
    deleteAccount(account.email)
    throw new Error(`Login fallido para ${account.email} - CUENTA ELIMINADA`)
  }

  const allResults: KWCacheEntry[] = []
  try {
    for (const kw of keywords) {
      p.log.step(`${mode === 'research' ? 'Buscando' : 'Sugiriendo'}: ${kw} (${country.toUpperCase()})`)
      try {
        const res = mode === 'research' 
          ? await api.search(kw, country, language)
          : await api.getSuggestions(kw, country, language)
        
        allResults.push(...res)
        
        // Deduct credits and track keyword
        const registry = loadRegistry()
        const accIdx = registry.findIndex(a => a.email === account.email)
        if (accIdx !== -1) {
          registry[accIdx].kwCredits = Math.max(0, registry[accIdx].kwCredits - 1)
          if (!registry[accIdx].keywords.includes(kw)) registry[accIdx].keywords.push(kw)
          registry[accIdx].lastUsed = new Date().toISOString()
          saveRegistry(registry)
        }
      } catch (e: unknown) {
        if (e instanceof NoCreditsError) { updateAccount(account.email, { kwCredits: 0 }); throw e }
        p.log.warn(`Error en ${kw}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
  } finally {
    await api.logout()
  }
  return allResults
}

async function ensureAccount(state: DinoRankState, excluded: Set<string>): Promise<DinoRankAccount> {
  const registry = loadRegistry()
  const available = registry
    .filter(a => a.kwCredits > 0 && !excluded.has(a.email))
    .sort((a, b) => b.kwCredits - a.kwCredits)

  if (available.length > 0) {
    const acc = available[0]!
    return { ...acc, postsGenerated: acc.content.length } as any
  }

  p.log.warn('Creando nueva cuenta DinoRank...')
  const { email, password } = await internals.createDinoRankAccount()
  const newAcc = registerAccount(email, password)
  return { ...newAcc, postsGenerated: 0 } as any
}

export const internals = { scrapeOnce, ensureAccount, clearSession, createDinoRankAccount }

export async function scrapeWithRetry(
  keywords: string[], 
  country: string, 
  dinoState: DinoRankState, 
  _useAI: boolean, 
  language: string = 'es',
  mode: 'research' | 'suggestions' = 'research',
  maxAccountsToCreate: number = 2
): Promise<KWCacheEntry[]> {
  const excluded = new Set<string>()
  let accountsCreated = 0

  for (let attempt = 1; attempt <= 10; attempt++) {
    const account = await internals.ensureAccount(dinoState, excluded)
    try {
      return await internals.scrapeOnce(keywords, country, account, language, mode)
    } catch (err) {
      if (err instanceof DeviceConflictError) {
        p.log.warn(`Conflicto de sesión (${err.email}) — rotando cuenta...`)
        excluded.add(err.email)
        internals.clearSession()
        continue
      }
      if (err instanceof NoCreditsError) {
        if (accountsCreated >= maxAccountsToCreate) {
          throw new Error(`Límite de creación de cuentas (${maxAccountsToCreate}) alcanzado.`)
        }
        p.log.warn(`Sin créditos (${err.email}) — creando nueva cuenta...`)
        excluded.add(err.email)
        internals.clearSession()
        const { email, password } = await internals.createDinoRankAccount()
        registerAccount(email, password)
        accountsCreated++
        continue
      }

      // Generic error (login failure, network, or invalid response) — exclude account and retry
      const msg = err instanceof Error ? err.message : String(err)
      p.log.warn(`Error con ${account.email}: ${msg} — rotando cuenta...`)
      excluded.add(account.email)
      
      if (msg.includes('Respuesta inválida')) {
        await new Promise(r => setTimeout(r, 5000))
      }
      continue
    }
  }
  throw new Error('Máximo de reintentos alcanzado o sin resultados válidos.')
}

// ─── MD File Updater ──────────────────────────────────────────────────────────

function splitByPipe(text: string): string[] {
  const trimmed = text.trim().replace(/^\||\|$/g, '')
  return trimmed.split(/(?<!\\)\|/).map((cell) => cell.trim().replace(/\\\|/g, '|'))
}

export function updateMarkdownTable(
  mdContent: string,
  kw: string,
  result: KWCacheEntry,
  country: string = 'es',
  language: string = 'es',
): string {
  const lines = mdContent.split(/\r?\n/)
  const tableStartIndex = lines.findIndex((line) => line.trim().startsWith('|'))
  if (tableStartIndex === -1) return mdContent

  const headers = splitByPipe(lines[tableStartIndex]!).map((h) =>
    h.trim().toLowerCase().replace(/[\s.]+/g, '_'),
  )
  const kwIdx = headers.indexOf('keyword')
  if (kwIdx === -1) return mdContent

  const volumeIdx = headers.indexOf('volume')
  const difficultyIdx = headers.indexOf('difficulty')
  const trendIdx = headers.indexOf('trend')
  const relatedIdx = headers.indexOf('related_searches')
  const sourceIdx = headers.indexOf('source')
  const countryIdx = headers.indexOf('country')
  const langIdx = headers.indexOf('language')

  const compToPercent = (raw: string): string => {
    const f = parseFloat(raw.replace(',', '.'))
    return !isNaN(f) ? Math.round(f * 100).toString() : raw
  }

  const cell = (content: string): string => ` ${content} `

  let updated = false
  const newLines = lines.map((line, index) => {
    if (index <= tableStartIndex + 1) return line
    if (!line.trim().startsWith('|')) return line

    const cells = splitByPipe(line)
    if (cells[kwIdx]?.trim().toLowerCase() !== kw.toLowerCase()) return line

    if (volumeIdx !== -1) cells[volumeIdx] = cell(result.volume.replace(/\D/g, ''))
    if (difficultyIdx !== -1) cells[difficultyIdx] = cell(compToPercent(result.competency))
    if (trendIdx !== -1) cells[trendIdx] = cell(result.trend?.length ? result.trend.join(',') : '')
    if (relatedIdx !== -1) cells[relatedIdx] = cell(result.relatedSearches)
    if (sourceIdx !== -1) cells[sourceIdx] = cell('DinoRank')
    if (countryIdx !== -1 && !cells[countryIdx]?.trim()) cells[countryIdx] = cell(country)
    if (langIdx !== -1 && !cells[langIdx]?.trim()) cells[langIdx] = cell(language)

    updated = true
    return '|' + cells.join('|') + '|'
  })

  if (!updated && headers.length > 0) {
    const endIdx = newLines.findIndex(
      (line, i) => i > tableStartIndex + 1 && !line.trim().startsWith('|') && line.trim() !== '',
    )
    const injectIdx = endIdx === -1 ? newLines.length : endIdx
    const newRow = Array(headers.length).fill(' ')
    newRow[kwIdx] = cell(kw)
    if (volumeIdx !== -1) newRow[volumeIdx] = cell(result.volume.replace(/\D/g, ''))
    if (difficultyIdx !== -1) newRow[difficultyIdx] = cell(compToPercent(result.competency))
    if (trendIdx !== -1) newRow[trendIdx] = cell(result.trend?.length ? result.trend.join(',') : '')
    if (relatedIdx !== -1) newRow[relatedIdx] = cell(result.relatedSearches)
    if (sourceIdx !== -1) newRow[sourceIdx] = cell('DinoRank')
    if (countryIdx !== -1) newRow[countryIdx] = cell(country)
    if (langIdx !== -1) newRow[langIdx] = cell(language)
    newLines.splice(injectIdx, 0, '|' + newRow.join('|') + '|')
  }

  return newLines.join('\n')
}

// ─── Cache Utilities ──────────────────────────────────────────────────────────

export function loadCache(): KWCache {
  if (!existsSync(CACHE_FILE)) return {}
  try { return JSON.parse(readFileSync(CACHE_FILE, 'utf-8')) } catch { return {} }
}

export function saveCache(cache: KWCache): void {
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
}

export function isCacheValid(timestamp: string): boolean {
  return Math.ceil(Math.abs(Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60 * 24)) <= 30
}

export function setDebug(_val: boolean) {}

import { exportToCsv } from './export-keywords-csv'

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = resolveArgs()
  if (!args) {
    console.error('Uso: pnpm scrape:dinorank "tu palabra clave" [--country=es] [--debug]')
    process.exit(1)
  }

  const { keywords } = args
  let { country } = args
  let language = 'es'

  // Pre-cargar país e idioma desde keywords.md si la keyword ya está en la tabla
  if (existsSync(KEYWORDS_FILE)) {
    try {
      const content = readFileSync(KEYWORDS_FILE, 'utf-8')
      const lines = content.split(/\r?\n/)
      const tableStartIndex = lines.findIndex(l => l.trim().startsWith('|'))
      if (tableStartIndex !== -1) {
        const headers = splitByPipe(lines[tableStartIndex]!).map(h => h.trim().toLowerCase().replace(/[\s.]+/g, '_'))
        const kwIdx = headers.indexOf('keyword'), countryIdx = headers.indexOf('country'), langIdx = headers.indexOf('language')
        if (kwIdx !== -1) {
          for (let i = tableStartIndex + 2; i < lines.length; i++) {
            const line = lines[i]!
            if (!line.trim().startsWith('|')) continue
            const cells = splitByPipe(line)
            if (cells[kwIdx] && keywords.some(k => cells[kwIdx]!.toLowerCase() === k.toLowerCase())) {
              if (countryIdx !== -1 && cells[countryIdx]?.trim()) country = cells[countryIdx]!.trim().toLowerCase()
              if (langIdx !== -1 && cells[langIdx]?.trim()) language = cells[langIdx]!.trim().toLowerCase()
              break
            }
          }
        }
      }
    } catch {}
  }

  p.intro('🦖 Scrape DinoRank — Keyword Research')
  p.log.info(`Keywords: ${keywords.length} en total  |  País: ${country}`)
  log('info', 'MAIN', 'Inicio', { keywords, country })

  const cache = loadCache()
  const uncachedKeywords: string[] = []
  const results: KWCacheEntry[] = []

  for (const kw of keywords) {
    const cacheKey = `${kw.toLowerCase()}_${country}`
    const cached = cache[cacheKey]
    if (cached && isCacheValid(cached.timestamp)) {
      p.log.success(`Caché hit: ${kw}`)
      results.push(cached)
    } else {
      uncachedKeywords.push(kw)
    }
  }

  if (uncachedKeywords.length > 0) {
    const s = p.spinner()
    s.start(`Extrayendo ${uncachedKeywords.length} keywords con DinoRank...`)
    const dinoState = loadState()

    try {
      const scraped = await scrapeWithRetry(uncachedKeywords, country, dinoState, args.useAI)
      s.stop('Extracción completada.')
      for (const res of scraped) {
        const cKey = `${res.keyword.toLowerCase()}_${res.country || country}`
        cache[cKey] = res
        results.push(res)
      }
      saveCache(cache)
      log('info', 'MAIN', 'Cache guardado', { count: scraped.length })
    } catch (err: unknown) {
      s.stop('Error en la extracción.')
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      p.log.error(msg)
      log('error', 'MAIN', msg)
      process.exit(1)
    }
  }

  const historyCount = loadHistory().length
  p.note(
    [
      `Total capturadas: ${results.length}`,
      ...results.slice(0, 5).map(r => `  - ${r.keyword} (${r.volume} vol, CPC: ${r.cpc}, Comp: ${r.competency})`),
      results.length > 5 ? `  ...y ${results.length - 5} más` : '',
      ``,
      `Historial: ${historyCount} entradas`,
    ].filter(Boolean).join('\n'),
    'Resultados',
  )

  if (existsSync(KEYWORDS_FILE)) {
    let content = readFileSync(KEYWORDS_FILE, 'utf-8')
    for (const res of results) {
      content = updateMarkdownTable(content, res.keyword, res, res.country || country, language)
    }
    writeFileSync(KEYWORDS_FILE, content)
    exportToCsv()
    p.log.success(`keywords.md actualizado con ${results.length} entradas.`)
    log('info', 'MAIN', 'keywords.md actualizado', { count: results.length })
    try {
      execSync(`npx prettier --write "${KEYWORDS_FILE}"`, { stdio: 'ignore' })
    } catch {}
  }

  p.outro('✅ Finalizado')
}

const isMainModule = process.argv[1] && process.argv[1].endsWith('scrape-dinorank.ts')
if (process.env.NODE_ENV !== 'test' && isMainModule) {
  main().catch(err => { console.error('FATAL:', err); process.exit(1) })
}
