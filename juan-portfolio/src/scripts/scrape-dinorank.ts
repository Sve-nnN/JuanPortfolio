#!/usr/bin/env tsx
/**
 * scrape-dinorank.ts — Extracción automática de Keyword Research de DinoRank
 *
 * Uso: pnpm scrape:dinorank "tu palabra clave" [--country=es] [--debug]
 *
 * Máquina de estados: detecta en qué punto del flujo está la página y actúa en consecuencia.
 * Maneja conflictos de sesión ("can't use your account on different devices"),
 * rotación de cuentas y creación automática de cuentas nuevas cuando no hay créditos.
 */

import * as p from '@clack/prompts'
import { chromium, type Page } from 'playwright'
import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import {
  loadState,
  saveState,
  registerAccount,
  randomStr,
  randomPassword,
  type DinoRankState,
  type DinoRankAccount,
} from './create-post'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '../..')

// ─── Constants ────────────────────────────────────────────────────────────────

const KEYWORDS_FILE = join(ROOT, 'content/keywords.md')
const CACHE_FILE = join(ROOT, 'content/dinorank-kw-cache.json')
/** Historial permanente de todos los scrapes realizados (append-only, sin TTL). */
const KW_HISTORY_FILE = join(ROOT, 'content/dinorank-kw-history.json')
/** Session file exclusivo para KW research — evita conflictos con create-post */
const KW_SESSION_FILE = join(ROOT, 'content/dinorank-kw-session.json')
const LOGS_DIR = join(ROOT, 'logs')
const LOG_FILE = join(LOGS_DIR, 'scrape-dinorank.log')

const CACHE_VALIDITY_DAYS = 30
const MAX_ITERATIONS = 45
const MAX_RETRIES = 3
const POLL_MS = 1500

const DINORANK_REGISTER_URL = 'https://dinorank.com/registro/?codPromo=dinoTrial25'
const DINORANK_LOGIN_URL = 'https://dinorank.com/login/'
const DINORANK_KW_RESEARCH_URL = 'https://dinorank.com/keyword-research/'

/**
 * Textos que DinoRank muestra cuando detecta sesión simultánea en otro dispositivo.
 * Se comprueban en body text y en el contenido de SweetAlerts.
 */
const DEVICE_CONFLICT_PATTERNS = [
  "can't use your account",
  'different devices',
  'diferentes dispositivos',
  'dispositivo diferente',
  'otro dispositivo',
  'otra sesión activa',
  'acceso simultáneo',
  'simultáneo',
  'logged in on another',
]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KWCacheEntry {
  keyword: string
  country: string
  volume: string
  competency: string
  cpc: string
  trend: number[]
  relatedSearches: string
  timestamp: string
}

/**
 * Entrada del historial permanente. Extiende KWCacheEntry con un flag que indica si
 * los resultados se cargaron desde el historial de DinoRank (sin consumir crédito).
 */
export interface KWHistoryEntry extends KWCacheEntry {
  /** true cuando los resultados vienen de "See analysis" en DinoRank, no de una búsqueda nueva */
  fromDinoRankHistory: boolean
}

export interface KWCache {
  [key: string]: KWCacheEntry
}

interface ArgResult {
  keyword: string
  country: string
  debug: boolean
  useAI: boolean
}

// ─── Custom Errors ───────────────────────────────────────────────────────────

class DeviceConflictError extends Error {
  constructor(public readonly email: string) {
    super(`Sesión simultánea detectada — cuenta: ${email}`)
    this.name = 'DeviceConflictError'
  }
}

class NoCreditsError extends Error {
  constructor(public readonly email: string) {
    super(`Sin créditos de KW Research — cuenta: ${email}`)
    this.name = 'NoCreditsError'
  }
}

// ─── State Machine ────────────────────────────────────────────────────────────

enum KwResearchState {
  /** El browser fue redirigido a /login */
  NEEDS_LOGIN = 'NEEDS_LOGIN',
  /** DinoRank detectó sesión activa en otro dispositivo */
  DEVICE_CONFLICT = 'DEVICE_CONFLICT',
  /** La cuenta no tiene créditos de KW Research */
  NO_CREDITS = 'NO_CREDITS',
  /** Un SweetAlert u overlay bloquea la interfaz */
  OVERLAY_VISIBLE = 'OVERLAY_VISIBLE',
  /** El input #keyword está visible y vacío */
  INPUT_READY = 'INPUT_READY',
  /** El input #keyword ya tiene la keyword escrita */
  INPUT_FILLED = 'INPUT_FILLED',
  /** El formulario fue enviado y los resultados están cargando */
  AWAITING_RESULTS = 'AWAITING_RESULTS',
  /** La tabla #tablaKwords es visible — datos listos para extraer */
  RESULTS_READY = 'RESULTS_READY',
  /** Nueva pantalla intermedia de la IA */
  AI_SELECTING = 'AI_SELECTING',
  /** La keyword fue buscada antes y muestra botón See analysis */
  HISTORY_NEEDS_CLICK = 'HISTORY_NEEDS_CLICK',
  /** Estado no reconocido */
  UNKNOWN = 'UNKNOWN',
}

// ─── Logger ───────────────────────────────────────────────────────────────────

let DEBUG_MODE = false

function log(level: 'info' | 'warn' | 'error', step: string, msg: string, data?: unknown): void {
  try {
    if (!existsSync(LOGS_DIR)) mkdirSync(LOGS_DIR, { recursive: true })
    const entry = JSON.stringify({
      ts: new Date().toISOString(),
      level,
      step,
      msg,
      ...(data !== undefined ? { data } : {}),
    })
    appendFileSync(LOG_FILE, entry + '\n', 'utf-8')
  } catch {}
}

// ─── Args ─────────────────────────────────────────────────────────────────────

function resolveArgs(): ArgResult | null {
  const argv = process.argv.slice(2)
  let debug = false
  let country = 'es'
  let keyword = ''
  let useAI = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!
    if (arg === '--debug') {
      debug = true
      DEBUG_MODE = true
    } else if (arg === '--ai') {
      useAI = true
    } else if (arg.startsWith('--country=')) {
      country = arg.slice('--country='.length)
    } else if (arg === '--country' && argv[i + 1]) {
      country = argv[++i]!
    } else if (!arg.startsWith('--')) {
      keyword = arg
    }
  }

  if (!keyword) return null
  return { keyword, country, debug, useAI }
}

// ─── Cache ────────────────────────────────────────────────────────────────────

function loadCache(): KWCache {
  if (!existsSync(CACHE_FILE)) return {}
  try {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf-8')) as KWCache
  } catch {
    return {}
  }
}

function saveCache(cache: KWCache): void {
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
}

function isCacheValid(timestamp: string): boolean {
  const diffDays = Math.ceil(
    Math.abs(Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60 * 24),
  )
  return diffDays <= CACHE_VALIDITY_DAYS
}

// ─── History ─────────────────────────────────────────────────────────────────

const MAX_HISTORY_ENTRIES = 500

function loadHistory(): KWHistoryEntry[] {
  if (!existsSync(KW_HISTORY_FILE)) return []
  try {
    return JSON.parse(readFileSync(KW_HISTORY_FILE, 'utf-8')) as KWHistoryEntry[]
  } catch {
    return []
  }
}

function appendHistory(entry: KWHistoryEntry): void {
  const history = loadHistory()
  history.unshift(entry)
  if (history.length > MAX_HISTORY_ENTRIES) history.splice(MAX_HISTORY_ENTRIES)
  writeFileSync(KW_HISTORY_FILE, JSON.stringify(history, null, 2))
  log('info', 'HISTORY', 'Entrada guardada en historial', {
    keyword: entry.keyword,
    country: entry.country,
    fromDinoRankHistory: entry.fromDinoRankHistory,
  })
}

// ─── Browser Helpers ──────────────────────────────────────────────────────────

async function dumpDebugInfo(page: Page, step: string): Promise<void> {
  if (!DEBUG_MODE) return
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const screenshotPath = `/tmp/scrape-dinorank-${step}-${ts}.png`
  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {})
  const info = await page
    .evaluate(() => {
      const bodySnippet = document.body.innerText.substring(0, 1500)
      const allButtons = document.querySelectorAll('button')
      const buttons = []
      for (let k = 0; k < allButtons.length; k++) {
        const text = (allButtons[k] as HTMLElement).innerText.trim()
        if (text) {
          buttons.push(text)
        }
      }

      const allInputs = document.querySelectorAll('input')
      const inputs = []
      for (let j = 0; j < allInputs.length; j++) {
        const input = allInputs[j] as HTMLInputElement
        inputs.push({
          id: input.id,
          name: input.name,
          type: input.type,
        })
      }
      return {
        url: window.location.href,
        title: document.title,
        buttons,
        inputs,
        bodySnippet,
      }
    })
    .catch(() => ({}))
  console.log(`[DEBUG: ${step}]`, JSON.stringify(info, null, 2))
  log('info', `DEBUG:${step}`, 'dump', info)
}

async function clearOverlays(page: Page): Promise<void> {
  const swalOk = page.locator('.swal2-confirm, .swal-button--confirm').first()
  if (await swalOk.isVisible().catch(() => false)) {
    await swalOk.click().catch(() => {})
    await page.waitForTimeout(600)
  }
  await page.keyboard.press('Escape').catch(() => {})
  // 3. Botón de "Skip all" / "Omitir"
  const skipBtn = page.locator('#skipBtn, .omitir-v').first()
  if (await skipBtn.isVisible().catch(() => false)) {
    log('info', 'OVERLAY', 'Haciendo click en Skip all')
    await skipBtn.click({ force: true }).catch(() => {})
  }

  await page
    .evaluate(() => {
      const selectors = [
        '.swal2-container',
        '.modal-backdrop',
        '#ventanaCompra',
        '.popup-overlay',
        '#tutorialBox',
        '.introjs-overlay',
        '#divGuiaKresearch',
      ]
      for (let i = 0; i < selectors.length; i++) {
        const el = document.querySelector(selectors[i]) as HTMLElement | null
        if (el) el.style.display = 'none'
      }

      // Limpiar tooltips si existen funciones globales
      if (typeof (window as any).omitirtodotooltip === 'function') {
        ;(window as any).omitirtodotooltip()
      }
    })
    .catch(() => {})
}

async function extractCredits(page: Page): Promise<number | null> {
  return page
    .evaluate(() => {
      const el = document.querySelector('.divlimites') as HTMLElement | null
      if (!el) return null
      const match = el.innerText.match(/restantes[:\s]*(\d+)/i)
      return match ? parseInt(match[1]!, 10) : null
    })
    .catch(() => null)
}

// ─── State Detection ──────────────────────────────────────────────────────────

async function detectState(
  page: Page,
  keyword: string,
  keywordEntered: boolean,
): Promise<KwResearchState> {
  // 1. Redirección a login
  if (page.url().includes('/login')) {
    log('info', 'STATE', 'NEEDS_LOGIN — URL contiene /login')
    return KwResearchState.NEEDS_LOGIN
  }

  // 2. SweetAlert: leer su texto antes de decidir si es conflicto o overlay genérico
  const swalText = await page
    .evaluate(() => {
      const swal = document.querySelector('.swal2-container') as HTMLElement | null
      if (!swal || swal.offsetParent === null) return null
      return swal.innerText.toLowerCase()
    })
    .catch(() => null)

  if (swalText !== null) {
    if (DEVICE_CONFLICT_PATTERNS.some((kw) => swalText.includes(kw))) {
      log('warn', 'STATE', 'DEVICE_CONFLICT — detectado en SweetAlert', {
        snippet: swalText.substring(0, 200),
      })
      return KwResearchState.DEVICE_CONFLICT
    }
    log('info', 'STATE', 'OVERLAY_VISIBLE — SweetAlert sin conflicto de dispositivo')
    return KwResearchState.OVERLAY_VISIBLE
  }

  // 2.5 Otras Overlays y Tutoriales
  const overlayDetected = await page
    .evaluate(() => {
      const selectors = [
        '#tutorialBox',
        '.introjs-overlay',
        '.popup-overlay',
        '#skipBtn',
        '#divGuiaKresearch',
        '.sweet-alert',
        '.modal',
      ]
      let overlayVisible = false
      for (let s = 0; s < selectors.length; s++) {
        const el = document.querySelector(selectors[s]) as HTMLElement | null
        if (el) {
          const style = window.getComputedStyle(el)
          if (
            style.display !== 'none' &&
            (el.offsetParent !== null || style.position === 'fixed')
          ) {
            overlayVisible = true
            break
          }
        }
      }

      return overlayVisible
    })
    .catch(() => false)

  if (overlayDetected) {
    log('info', 'STATE', 'OVERLAY_VISIBLE — Tutorial, popup o skip detectado')
    return KwResearchState.OVERLAY_VISIBLE
  }

  // 3. Conflicto de dispositivo en body (fuera de SweetAlert)
  const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase()).catch(() => '')
  if (DEVICE_CONFLICT_PATTERNS.some((kw) => bodyText.includes(kw))) {
    log('warn', 'STATE', 'DEVICE_CONFLICT — detectado en body', {
      snippet: bodyText.substring(0, 300),
    })
    return KwResearchState.DEVICE_CONFLICT
  }

  // 4. Resultados listos (Checkboxes o Tablas con datos)
  const hasResultsData = await page
    .evaluate((expectedKw) => {
      let rowsCount = 0

      // 1. Selector por ID de checkbox (muy fiable en DinoRank)
      const checkboxes = Array.from(document.querySelectorAll('input[id^="checkClip"]'))
      if (checkboxes.length > 0) {
        rowsCount = checkboxes.length
      } else {
        // 2. Fallback: filas con datos en tablas conocidas
        const selectors = ['#tablaKresearch', '#tablaKresearchtrackeo']

        for (let i = 0; i < selectors.length; i++) {
          const table = document.querySelector(selectors[i])
          if (table) {
            const tableRows = table.querySelectorAll('tr')
            let validRowCount = 0
            for (let j = 0; j < tableRows.length; j++) {
              const tr = tableRows[j] as HTMLElement
              const hasText = tr.innerText.trim().length > 0
              const isHeader = tr.querySelector('th') !== null
              const isVisible = tr.offsetParent !== null
              if (hasText && !isHeader && isVisible) {
                validRowCount++
              }
            }
            if (validRowCount > rowsCount) {
              rowsCount = validRowCount
            }
          }
        }
      }

      const bodyTextStr = document.body.innerText.toLowerCase()
      const hasXls = bodyTextStr.includes('xls')
      // Usamos el keyword pasado como argumento
      const hasTargetKw = expectedKw && bodyTextStr.includes(expectedKw.toLowerCase())

      // Debug object to capture what we see
      const allCheckboxes = document.querySelectorAll('input[type="checkbox"]')
      const checkboxIds = []
      for (let k = 0; k < allCheckboxes.length; k++) {
        checkboxIds.push(allCheckboxes[k].id)
      }

      const debugInfo: any = {
        rowsCount,
        hasXls,
        hasTargetKw,
        checkboxes: checkboxIds,
        tableExists: document.querySelector('#tablaKresearch') ? true : false,
        tableTrCount: document.querySelector('#tablaKresearch')?.querySelectorAll('tr').length,
        checkClipCount: document.querySelectorAll('input[id^="checkClip"]').length,
      }

      // Si hay filas, o si hay botón XLS + la keyword buscada aparece en el cuerpo
      if (rowsCount > 0 || (hasXls && hasTargetKw)) {
        return {
          found: true,
          rowsCount,
          viaXls: rowsCount === 0 && hasXls && hasTargetKw,
          debugInfo,
        }
      }

      // Debug: si vemos texto que parece de resultados pero no filas detectadas
      if (
        bodyTextStr.includes('vol.') &&
        (bodyTextStr.includes('competencia') || bodyTextStr.includes('cpc'))
      ) {
        return { found: false, suspected: true, debugInfo }
      }

      const needsHistoryClick = (() => {
        const historyTable =
          document.querySelector('#historicalKresearch') || document.querySelector('table')
        if (!historyTable) return false

        const rows = Array.from(historyTable.querySelectorAll('tr'))
        for (let i = 0; i < rows.length; i++) {
          const tr = rows[i]
          // If row text contains exact keyword (avoid broad matches)
          const trText = tr.textContent?.toLowerCase() || ''
          if (
            expectedKw &&
            trText.includes(expectedKw.toLowerCase()) &&
            trText.includes('see analysis')
          ) {
            return true
          }
        }
        return false
      })()

      if (needsHistoryClick && rowsCount === 0) {
        return { found: false, wantsClick: true, debugInfo }
      }

      return { found: false, debugInfo }
    }, keyword)
    .catch((err) => {
      return { found: false, error: err.message }
    })

  if (hasResultsData && (hasResultsData as any).found) {
    log('info', 'STATE', 'RESULTS_READY', hasResultsData)
    return KwResearchState.RESULTS_READY
  }

  if (hasResultsData && (hasResultsData as any).wantsClick) {
    log('info', 'STATE', 'HISTORY_NEEDS_CLICK', hasResultsData)
    return KwResearchState.HISTORY_NEEDS_CLICK
  }

  if (hasResultsData && !(hasResultsData as any).found) {
    log('warn', 'STATE', 'Evaluación de RESULT_READY falló la detección', hasResultsData)
  }

  if (hasResultsData && (hasResultsData as any).suspected) {
    log(
      'warn',
      'STATE',
      'Resultados sospechosos pero no detectados via selectores de tabla',
      hasResultsData,
    )
  }

  // 4.5 Pantalla intermedia de selección IA (si aparece)
  const isAiSelecting = await page
    .evaluate(() => {
      const buttons = document.querySelectorAll('a.button-fondomagentadinobrain[id^="button-"]')
      return (
        buttons.length > 0 && !!document.body.innerText.includes('Recomendaciones alternativas')
      )
    })
    .catch(() => false)

  if (isAiSelecting) {
    log('info', 'STATE', 'AI_SELECTING')
    return KwResearchState.AI_SELECTING
  }

  // 5. Sin créditos (solo checar si la página ya cargó, evitar false positives al inicio)
  const credits = await extractCredits(page)
  if (credits === 0) {
    log('warn', 'STATE', 'NO_CREDITS — créditos restantes = 0')
    return KwResearchState.NO_CREDITS
  }

  // 6. Esperando resultados: loading gif visible o indicadores de texto
  if (keywordEntered) {
    const isLoading = await page
      .evaluate(() => {
        // Selector de carga específico de DinoRank y DinoBRAIN
        const loaderSelectors = [
          '.kresearchIACargando',
          '#cargandoKresearch',
          '#loading',
          '.loader',
        ]

        for (const sel of loaderSelectors) {
          const el = document.querySelector(sel) as HTMLElement | null
          if (el && el.offsetParent !== null && window.getComputedStyle(el).display !== 'none') {
            // Verificar si el contenedor de carga realmente tiene contenido o un gif
            if (el.innerHTML.includes('gif') || el.innerText.trim().length > 0) {
              return true
            }
          }
        }

        // Búsqueda de imágenes de carga visibles
        const images = document.querySelectorAll('img')
        let hasLoadingImg = false
        for (let i = 0; i < images.length; i++) {
          const img = images[i]
          const src = img.src.toLowerCase()
          if (
            (src.includes('loading') || src.includes('cargando')) &&
            img.offsetParent !== null &&
            window.getComputedStyle(img).display !== 'none'
          ) {
            hasLoadingImg = true
            break
          }
        }
        if (hasLoadingImg) return true

        const text = document.body.innerText.toLowerCase()
        // Solo considerar "cargando" si no hay resultados ni selección IA
        const hasAnyData = !!(
          document.querySelector('input.checkKresearchCC') ||
          document.querySelector('a.button-fondomagentadinobrain') ||
          document.querySelector('#tablaKresearch tr.botonesFila') ||
          document.querySelector('#tablaKresearchtrackeo tr.botonesFila')
        )

        if (!hasAnyData) {
          const text = document.body.innerText.toLowerCase()
          return (
            text.includes('generando sugerencias') ||
            text.includes('analizando palabras') ||
            text.includes('obteniendo datos')
          )
        }
        return false
      })
      .catch(() => false)

    if (isLoading) {
      log('info', 'STATE', 'AWAITING_RESULTS — carga detectada')
      return KwResearchState.AWAITING_RESULTS
    }
  }

  // 7. Input de keyword
  const kwInput = page.locator('#keyword').first()
  if (await kwInput.isVisible().catch(() => false)) {
    const val = await kwInput.inputValue().catch(() => '')
    if (val.trim().length >= 2) {
      log('info', 'STATE', 'INPUT_FILLED', { value: val })
      return KwResearchState.INPUT_FILLED
    }
    log('info', 'STATE', 'INPUT_READY — input vacío visible')
    return KwResearchState.INPUT_READY
  }

  log('info', 'STATE', 'UNKNOWN', { url: page.url() })
  return KwResearchState.UNKNOWN
}

// ─── Session Management ───────────────────────────────────────────────────────

async function saveSession(page: Page): Promise<void> {
  const cookies = await page.context().cookies()
  writeFileSync(KW_SESSION_FILE, JSON.stringify(cookies, null, 2))
  log('info', 'SESSION', 'Sesión guardada')
}

function clearSession(): void {
  if (existsSync(KW_SESSION_FILE)) {
    writeFileSync(KW_SESSION_FILE, '[]')
    log('info', 'SESSION', 'Sesión invalidada')
  }
}

async function restoreSession(page: Page): Promise<boolean> {
  if (!existsSync(KW_SESSION_FILE)) return false
  try {
    const cookies = JSON.parse(readFileSync(KW_SESSION_FILE, 'utf-8'))
    if (!Array.isArray(cookies) || cookies.length === 0) return false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.context().addCookies(cookies as any)
    await page.goto(DINORANK_KW_RESEARCH_URL, { waitUntil: 'domcontentloaded', timeout: 20_000 })
    await page.waitForTimeout(2000)
    if (page.url().includes('/login')) return false
    const hasInput = await page
      .locator('#keyword')
      .isVisible()
      .catch(() => false)
    log('info', 'SESSION', hasInput ? 'Sesión restaurada OK' : 'Sesión expirada')
    return hasInput
  } catch {
    return false
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────

async function loginToDinoRank(page: Page, email: string, password: string): Promise<void> {
  log('info', 'LOGIN', `Autenticando: ${email}`)
  p.log.info(`Autenticando con ${email}...`)
  await page.goto(DINORANK_LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  await page.waitForTimeout(1000)

  // Esperar el input de usuario
  try {
    await page.waitForSelector('#usuario', { state: 'visible', timeout: 10_000 })
  } catch {
    const isLoggedIn = await page
      .evaluate(() => !!document.querySelector('#enlaceCierraCabecera'))
      .catch(() => false)
    if (isLoggedIn) {
      log('info', 'LOGIN', 'Sesión ya activa en DOM')
      p.log.success('Sesión ya activa.')
      return
    }
    await dumpDebugInfo(page, 'login-no-input')
    throw new Error('El input #usuario no apareció y no hay sesión activa.')
  }

  await page.locator('#usuario').fill(email)
  await page.locator('#password').fill(password)
  await page.locator('#botonLogin').click()

  // Esperar resultado: éxito o popup de error/conflicto
  await Promise.race([
    page.waitForSelector('#enlaceCierraCabecera', { timeout: 14_000 }),
    page.waitForSelector('.swal2-popup', { timeout: 14_000 }),
  ]).catch(() => {})

  await page.waitForTimeout(800)

  // Comprobar conflicto de dispositivo en popup o body
  const conflictFound = await page
    .evaluate((patterns: string[]) => {
      const sources = [
        (document.querySelector('.swal2-popup') as HTMLElement | null)?.innerText?.toLowerCase() ??
          '',
        document.body.innerText.toLowerCase(),
      ]
      let found = false
      for (let i = 0; i < patterns.length; i++) {
        for (let j = 0; j < sources.length; j++) {
          if (sources[j].includes(patterns[i])) {
            found = true
            break
          }
        }
        if (found) break
      }
      return found
    }, DEVICE_CONFLICT_PATTERNS)
    .catch(() => false)

  if (conflictFound) {
    log('warn', 'LOGIN', `Conflicto de dispositivo para ${email}`)
    throw new DeviceConflictError(email)
  }

  // Cerrar cualquier popup genérico
  await page
    .evaluate(() => {
      const btn = document.querySelector('.swal2-confirm') as HTMLElement | null
      if (btn) btn.click()
    })
    .catch(() => {})

  const isLoggedIn = await page
    .evaluate(() => !!document.querySelector('#enlaceCierraCabecera'))
    .catch(() => false)

  if (!isLoggedIn) {
    await dumpDebugInfo(page, 'login-failed')
    throw new Error(`Login fallido para ${email}: perfil no encontrado en DOM.`)
  }

  await saveSession(page)
  log('info', 'LOGIN', `Autenticación exitosa: ${email}`)
  p.log.success('Autenticación exitosa.')
}

// ─── Account Management ───────────────────────────────────────────────────────

function getAvailableAccount(
  state: DinoRankState,
  excludedEmails: Set<string>,
): DinoRankAccount | null {
  for (const acc of state.accounts) {
    if (!excludedEmails.has(acc.email)) return acc
  }
  return null
}

async function createDinoRankAccount(): Promise<{ email: string; password: string }> {
  const email = `${randomStr(8)}${randomStr(4)}@gmail.com`
  const password = randomPassword()
  log('info', 'ACCOUNT', 'Creando nueva cuenta DinoRank', { email })
  p.log.info(`Nueva cuenta: ${email}`)
  const browser = await chromium.launch({ headless: false, slowMo: 120 })
  const page = await browser.newPage()
  try {
    await page.goto(DINORANK_REGISTER_URL, { waitUntil: 'domcontentloaded' })
    await page.locator('#usuarior').fill(email)
    await page.locator('#telefonor').fill('+34666000000')
    await page.locator('#passwordr').fill(password)
    await page.locator('#passwordr2').fill(password)
    if (!(await page.locator('#aceptoPrivacidad').isChecked())) {
      await page.locator('#aceptoPrivacidad').check()
    }
    p.note('Completa el registro manualmente si hay CAPTCHA y pulsa continuar.', 'Acción requerida')
    const confirmed = await p.confirm({ message: '¿Registro completado?' })
    if (p.isCancel(confirmed) || !confirmed) throw new Error('Registro cancelado por el usuario.')
  } finally {
    await browser.close()
  }
  return { email, password }
}

async function ensureAccount(
  state: DinoRankState,
  excludedEmails: Set<string>,
): Promise<DinoRankAccount> {
  const acc = getAvailableAccount(state, excludedEmails)
  if (acc) return acc

  p.log.warn('Sin cuentas disponibles. Creando una nueva...')
  log('warn', 'ACCOUNT', 'Sin cuentas disponibles, creando nueva')
  const { email, password } = await createDinoRankAccount()
  registerAccount(state, email, password)
  saveState(state)
  return state.accounts[state.accounts.length - 1]!
}

// ─── Data Extraction ──────────────────────────────────────────────────────────

async function extractResults(
  page: Page,
  keyword: string,
  country: string,
): Promise<KWCacheEntry[]> {
  await page.waitForTimeout(2000) // Dejar que el JS renderice completamente

  const data = await page.evaluate((searchKw) => {
    let volume = ''
    let cpc = ''
    let competency = ''
    const related: string[] = []
    const aiSuggestions: Array<{
      keyword: string
      volume: string
      competency: string
      cpc: string
    }> = []

    const selectors = ['#tablaKresearch', '#tablaKresearchtrackeo']
    let allRows: Element[] = []

    for (let s = 0; s < selectors.length; s++) {
      const table = document.querySelector(selectors[s])
      if (table) {
        const tableRows = table.querySelectorAll('tr')
        for (let r = 0; r < tableRows.length; r++) {
          const tr = tableRows[r] as HTMLElement
          const hasText = tr.innerText.trim().length > 0
          const isHeader = tr.querySelector('th') !== null
          const isVisible = tr.offsetParent !== null
          if (hasText && !isHeader && isVisible) {
            allRows.push(tr)
          }
        }
      }
    }

    if (allRows.length === 0) {
      // Backup: buscar cualquier tr que contenga el checkbox ID
      const allTrs = document.querySelectorAll('tr')
      for (let t = 0; t < allTrs.length; t++) {
        if (allTrs[t].querySelector('input[id^="checkClip"]')) {
          allRows.push(allTrs[t])
        }
      }
    }

    const debugRows: any[] = []

    const rows = allRows
    for (let i = 0; i < Math.min(rows.length, 30); i++) {
      const row = rows[i]!
      // En DinoRank, la keyword suele ser el texto cerca del checkbox
      const kwInput = row.querySelector('input[id^="checkClip"]')
      if (!kwInput) continue

      // Intentar obtener la keyword desde el texto de la fila, quitando saltos de línea ruidosos
      const rawText = (row as HTMLElement).innerText
      const splitCells = rawText.split('\t')
      const innerTextCells = []
      for (let c = 0; c < splitCells.length; c++) {
        const trimmed = splitCells[c].trim()
        if (trimmed.length > 0) {
          innerTextCells.push(trimmed)
        }
      }

      const tdCells = Array.from(row.querySelectorAll('td'))
      const isExpandedRow = tdCells.length === 1 && tdCells[0]?.hasAttribute('colspan')

      let txt = ''
      if (isExpandedRow) {
        // En filas expandidas, el texto está dentro de div.paddingderechobotones
        const kwDiv = row.querySelector('.paddingderechobotones')
        if (kwDiv) {
          txt = kwDiv.textContent?.replace(/[\n\r]+.*$/g, '')?.trim() || ''
        } else {
          txt =
            row
              .querySelector('input[type="checkbox"]')
              ?.closest('span')
              ?.parentElement?.nextElementSibling?.textContent?.replace(/[\n\r]+.*$/g, '')
              ?.trim() || ''
        }
      } else if (tdCells.length > 1) {
        const kwCell = tdCells[1] as HTMLElement
        if (kwCell) {
          const text = kwCell.innerText || ''
          txt = text.split('\n')[0]?.trim() || ''
        }
      } else if (tdCells.length === 1) {
        txt = (tdCells[0] as HTMLElement)?.innerText?.split('\n')[0]?.trim() || ''
      }

      if (!txt || txt.length < 2) {
        txt = innerTextCells[0] || ''
      }

      let rawVol = ''
      let rawComp = ''
      let rawCpc = ''

      if (isExpandedRow) {
        const dataDivs = Array.from(row.querySelectorAll('div.listadobordelefttabla.derecha'))
        rawVol = dataDivs[0]?.textContent?.trim() || ''
        rawComp = dataDivs[1]?.textContent?.trim() || ''
        rawCpc = dataDivs[2]?.textContent?.trim() || ''
      } else {
        const volCell = row.querySelector('td.derecha:not(.ellipsis)')
        const compCell = row.querySelector('td.derecha.ellipsis')
        const cpcCell =
          row.querySelector('td.izquierda[nowrap]') ||
          Array.from(row.querySelectorAll('td.izquierda')).find(
            (el) => el.textContent?.includes('€') || el.textContent?.includes('$'),
          )

        rawVol = volCell?.textContent?.trim() || tdCells[2]?.textContent?.trim() || ''
        rawComp = compCell?.textContent?.trim() || tdCells[3]?.textContent?.trim() || ''
        rawCpc = cpcCell?.textContent?.trim() || tdCells[4]?.textContent?.trim() || ''
      }

      const volCleaned = rawVol.replace(/[^0-9.]/g, '') || '0'

      debugRows.push({
        txt,
        exactMatch: txt.toLowerCase() === searchKw.toLowerCase(),
        isExpandedRow,
        rawVol,
        volCleaned,
      })

      if (!txt || txt.toLowerCase().includes('keywords')) continue

      const tableId = row.closest('table')?.id || ''

      // Si es el resultado principal
      if (!volume && txt.toLowerCase() === searchKw.toLowerCase()) {
        volume = volCleaned

        const compMatch = rawComp.match(/[\d,.]+/)
        competency = compMatch ? compMatch[0].replace(',', '.') : '0'

        const cpcMatch = rawCpc.match(/[\d,.]+/)
        cpc = cpcMatch ? cpcMatch[0].replace(',', '.') : '0'
      }
      // Si es de la tabla de IA, extraer métricas completas
      else if (tableId === 'tablaKresearchtrackeo' || tableId === 'tablaKwords') {
        const rawVol = tdCells[1]?.textContent?.trim() || ''
        const vol = rawVol.replace(/[^0-9.]/g, '') || '0'

        const rawComp = tdCells[2]?.textContent?.trim() || ''
        const compMatch = rawComp.match(/[\d,.]+/)
        const comp = compMatch ? compMatch[0].replace(',', '.') : '0'

        const rawCpc = tdCells[3]?.textContent?.trim() || ''
        const cpcMatch = rawCpc.match(/[\d,.]+/)
        const cCpc = cpcMatch ? cpcMatch[0].replace(',', '.') : '0'

        aiSuggestions.push({
          keyword: txt,
          volume: vol,
          competency: comp,
          cpc: cCpc,
        })
      }
      // Si es de la tabla normal pero no es la keyword principal
      else if (txt.toLowerCase() !== searchKw.toLowerCase()) {
        related.push(txt)
      }
    }

    return { volume, cpc, competency, related, aiSuggestions, debugRows }
  }, keyword)

  if (!data.volume && data.related.length === 0 && data.aiSuggestions.length === 0) {
    log('error', 'EXTRACT', 'Debug rows of failed extraction', { debugRows: data.debugRows })
    throw new Error('No se pudieron extraer datos. La keyword puede no tener volumen en este país.')
  }

  log('info', 'EXTRACT', 'Datos extraídos', {
    keyword,
    volume: data.volume,
    aiItems: data.aiSuggestions.length,
    debugFirstRow: data.debugRows[0],
  })

  const results: KWCacheEntry[] = []

  results.push({
    keyword,
    country,
    volume: data.volume || '0',
    cpc: data.cpc || '0',
    competency: data.competency || '0',
    trend: [],
    relatedSearches: data.related
      .filter((r) => r.toLowerCase() !== keyword.toLowerCase())
      .slice(0, 5)
      .join('; '),
    timestamp: new Date().toISOString(),
  })

  for (const ai of data.aiSuggestions) {
    results.push({
      keyword: ai.keyword,
      country,
      volume: ai.volume,
      cpc: ai.cpc,
      competency: ai.competency,
      trend: [],
      relatedSearches: keyword, // Point back to main keyword
      timestamp: new Date().toISOString(),
    })
  }

  return results
}

// ─── Scraper Core (state machine) ────────────────────────────────────────────

async function scrapeOnce(
  keyword: string,
  country: string,
  account: DinoRankAccount,
  useAI: boolean,
): Promise<KWCacheEntry[]> {
  const browser = await chromium.launch({ headless: false, slowMo: 100 })
  const page = await browser.newPage()

  if (DEBUG_MODE) {
    page.on('console', (msg) => log('info', 'BROWSER', msg.text()))
  }

  let keywordEntered = false
  /** true cuando el análisis se cargó desde el historial de DinoRank (sin consumir crédito) */
  let usedHistoryReplay = false
  /** true en cuanto se hace click en #buscaKresearch — impide reenvíos múltiples */
  let submitted = false

  try {
    log(
      'info',
      'SCRAPE',
      `Inicio — keyword: "${keyword}", país: ${country}, cuenta: ${account.email}`,
    )

    const sessionOk = await restoreSession(page)
    if (!sessionOk) {
      await loginToDinoRank(page, account.email, account.password)
      await page.goto(DINORANK_KW_RESEARCH_URL, { waitUntil: 'domcontentloaded' })
    }

    await dumpDebugInfo(page, 'post-init')

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      await page.waitForTimeout(POLL_MS)
      const state = await detectState(page, keyword, keywordEntered)
      log('info', 'LOOP', `[${i + 1}/${MAX_ITERATIONS}] Estado: ${state}`)

      switch (state) {
        case KwResearchState.NEEDS_LOGIN:
          p.log.step('Redirigido a login — autenticando...')
          await loginToDinoRank(page, account.email, account.password)
          await page.goto(DINORANK_KW_RESEARCH_URL, { waitUntil: 'domcontentloaded' })
          break

        case KwResearchState.DEVICE_CONFLICT:
          // La cuenta está en uso en otro dispositivo.
          // Hay que rotar a otra cuenta — el retry wrapper lo gestiona.
          throw new DeviceConflictError(account.email)

        case KwResearchState.NO_CREDITS:
          // Créditos agotados en esta cuenta.
          // El retry wrapper creará/elegirá otra cuenta.
          throw new NoCreditsError(account.email)

        case KwResearchState.OVERLAY_VISIBLE:
          p.log.step('Cerrando overlay...')
          await clearOverlays(page)
          await dumpDebugInfo(page, `overlay-${i}`)
          break

        case KwResearchState.AI_SELECTING:
          log('info', 'SCRAPE', 'Seleccionando keyword en pantalla IA...')
          await page.click('a.button-fondomagentadinobrain[id^="button-0"]').catch(() => {})
          await page.waitForTimeout(2000)
          break

        case KwResearchState.HISTORY_NEEDS_CLICK:
          p.log.step('Clicando "See analysis" desde el historial para recargar sin gastar salto...')
          await page
            .evaluate((kw) => {
              const historyTable =
                document.querySelector('#historicalKresearch') || document.querySelector('table')
              if (!historyTable) return
              const rows = Array.from(historyTable.querySelectorAll('tr'))
              for (let j = 0; j < rows.length; j++) {
                const tr = rows[j]
                const text = tr.textContent?.toLowerCase() || ''
                if (text.includes(kw.toLowerCase()) && text.includes('see analysis')) {
                  const btn = tr.querySelector('div[onclick*="kresarch"]') as HTMLElement
                  if (btn) {
                    btn.click()
                    break
                  }
                }
              }
            }, keyword)
            .catch(() => {})

          await page.waitForTimeout(3000)
          usedHistoryReplay = true
          keywordEntered = true
          break

        case KwResearchState.INPUT_READY: {
          // Antes de gastar un crédito, buscar en el historial de análisis anteriores de DinoRank.
          // La sección #analisisAnteriores lista búsquedas previas con un botón "See analysis"
          // que recarga los resultados usando kresarch() sin consumir crédito.
          p.log.step('Comprobando historial de análisis anteriores en DinoRank...')
          await page.waitForTimeout(3000) // Esperar a que JS cargue el historial

          const prevAnalysis = await page
            .evaluate(
              (arg: { kw: string; requestedCountry: string }) => {
                const { kw, requestedCountry } = arg
                const rows = document.querySelectorAll('#analisisAnteriores tbody tr')
                for (let j = 0; j < rows.length; j++) {
                  const row = rows[j]!
                  const kwCell = row.querySelector('td:nth-child(1)')
                  const kwText = kwCell?.textContent?.trim().toLowerCase() ?? ''
                  if (!kwText.includes(kw.toLowerCase())) continue

                  const btn = row.querySelector('[onclick*="kresarch"]') as HTMLElement | null
                  if (!btn) continue

                  // Extraer el país del onclick: setSimpleDropdownValue('keyword_pais', 'MX', ...)
                  const onclick = btn.getAttribute('onclick') ?? ''
                  const countryMatch = onclick.match(/keyword_pais[^,]*,\s*'([A-Z]{2,3})'/)
                  const analysisCountry = countryMatch?.[1]?.toLowerCase() ?? ''

                  // Usar análisis existente ignorando el país para no gastar créditos repetidos
                  btn.click()
                  return { found: true, analysisCountry }
                }
                return { found: false, analysisCountry: '' }
              },
              { kw: keyword, requestedCountry: country },
            )
            .catch(() => ({ found: false, analysisCountry: '' }))

          if (prevAnalysis.found) {
            p.log.success(
              `Análisis anterior encontrado (${(prevAnalysis.analysisCountry || country).toUpperCase()}) — cargando sin consumir crédito.`,
            )
            log(
              'info',
              'HISTORY',
              `Keyword "${keyword}" encontrada en historial DinoRank, recargando`,
              {
                country: prevAnalysis.analysisCountry,
              },
            )
            keywordEntered = true
            usedHistoryReplay = true
            break
          }

          // Sin historial coincidente — búsqueda nueva
          p.log.step(`Introduciendo keyword: "${keyword}" (búsqueda nueva)`)
          await page.locator('#keyword').fill(keyword)
          keywordEntered = true

          // Activar sugerencias de IA si el flag está activo
          if (useAI) {
            const iaCheckbox = page.locator('#kresearchConIAInput').first()
            if (await iaCheckbox.isVisible().catch(() => false)) {
              const isChecked = await iaCheckbox.isChecked().catch(() => false)
              if (!isChecked) {
                await iaCheckbox
                  .check({ force: true })
                  .catch(() => p.log.warn('No se pudo marcar checkbox de sugerencias IA.'))
                await page.waitForTimeout(500)
              }
            }
          }

          const countrySelect = page.locator('#localizar').first()
          if (await countrySelect.isVisible().catch(() => false)) {
            await countrySelect
              .selectOption(country)
              .catch(() => p.log.warn(`No se pudo seleccionar país: ${country}`))
            await page.waitForTimeout(500)
          }

          break
        }

        case KwResearchState.INPUT_FILLED: {
          // Si el replay de historial ya disparó kresarch(), o el formulario ya fue enviado,
          // el input puede seguir relleno mientras carga — no reenviar.
          if (usedHistoryReplay || submitted) {
            p.log.step('Esperando carga de resultados...')
            if (i > 10) await dumpDebugInfo(page, `stuck-input-filled-${i}`)
            // Si llevamos mucho tiempo esperando, volver a intentar clic en analizar
            if (i > 20 && i % 5 === 0) {
              log('warn', 'SCRAPE', 'Re-intentando envío de búsqueda...')
              const btn = page.locator('#buscaKresearch').first()
              if (await btn.isVisible()) await btn.click({ force: true })
            }
            break
          }
          p.log.step('Enviando búsqueda...')
          const submitBtn = page.locator('#buscaKresearch').first()
          if (await submitBtn.isVisible().catch(() => false)) {
            await submitBtn.click({ force: true })
          } else {
            await page.locator('#keyword').press('Enter')
          }
          submitted = true
          if (i > 10) await dumpDebugInfo(page, `stuck-input-filled-${i}`)
          break
        }

        case KwResearchState.AWAITING_RESULTS:
          p.log.step(`Esperando resultados... (${i + 1}/${MAX_ITERATIONS})`)
          break

        case KwResearchState.RESULTS_READY: {
          p.log.step('Extrayendo resultados...')
          const results = await extractResults(page, keyword, country)
          await saveSession(page)

          // Guardar resultados
          for (const res of results) {
            appendHistory({ ...res, fromDinoRankHistory: usedHistoryReplay })
          }

          const mainRes =
            results.find((r) => r.keyword.toLowerCase() === keyword.toLowerCase()) || results[0]
          if (mainRes) {
            p.log.success(`Extracción exitosa: ${mainRes.keyword} (Vol: ${mainRes.volume})`)
          }

          if (results.length > 1) {
            p.log.info(`Se guardaron ${results.length - 1} sugerencias adicionales.`)
          }

          return results
        }

        case KwResearchState.UNKNOWN:
          await dumpDebugInfo(page, `unknown-${i}`)
          // Si llevamos varios ciclos perdidos, volver a la página de KW Research
          if (i >= 3 && i % 4 === 0) {
            p.log.warn('Estado desconocido — volviendo a la página de keyword research...')
            await page.goto(DINORANK_KW_RESEARCH_URL, { waitUntil: 'domcontentloaded' })
          }
          break
      }
    }

    throw new Error(
      `Timeout tras ${MAX_ITERATIONS} iteraciones sin completar el scrape de "${keyword}".`,
    )
  } finally {
    await browser.close()
  }
}

// ─── Retry Wrapper ────────────────────────────────────────────────────────────

async function scrapeWithRetry(
  keyword: string,
  country: string,
  dinoState: DinoRankState,
  useAI: boolean,
  attempt = 1,
  excludedEmails = new Set<string>(),
): Promise<KWCacheEntry[]> {
  for (; attempt <= MAX_RETRIES; attempt++) {
    const account = await ensureAccount(dinoState, excludedEmails)
    log('info', 'RETRY', `Intento ${attempt}/${MAX_RETRIES} — cuenta: ${account.email}`)
    p.log.step(`Intento ${attempt}/${MAX_RETRIES} con ${account.email}`)

    try {
      return await scrapeOnce(keyword, country, account, useAI)
    } catch (err) {
      if (err instanceof DeviceConflictError) {
        p.log.warn(`Conflicto de sesión (${err.email}) — rotando a otra cuenta...`)
        log('warn', 'RETRY', 'DeviceConflict — rotando cuenta', { email: err.email, attempt })
        excludedEmails.add(err.email)
        clearSession() // Invalidar la sesión para forzar login fresco con la siguiente cuenta
        continue
      }

      if (err instanceof NoCreditsError) {
        p.log.warn(`Sin créditos (${err.email}) — creando nueva cuenta...`)
        log('warn', 'RETRY', 'NoCredits — creando nueva cuenta', { email: err.email, attempt })
        excludedEmails.add(err.email)
        clearSession()
        // Forzar creación de cuenta nueva en el siguiente ensureAccount
        const { email, password } = await createDinoRankAccount()
        registerAccount(dinoState, email, password)
        saveState(dinoState)
        continue
      }

      // Error no recuperable: propagar
      throw err
    }
  }

  throw new Error(`Fallaron ${MAX_RETRIES} intentos para la keyword "${keyword}".`)
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
    h
      .trim()
      .toLowerCase()
      .replace(/[\s.]+/g, '_'),
  )
  const kwIdx = headers.indexOf('keyword')
  if (kwIdx === -1) return mdContent

  const volumeIdx = headers.indexOf('volume')
  const difficultyIdx = headers.indexOf('difficulty')
  const relatedIdx = headers.indexOf('related_searches')
  const sourceIdx = headers.indexOf('source')
  const countryIdx = headers.indexOf('country')
  const langIdx = headers.indexOf('language')

  const compToPercent = (raw: string): string => {
    const f = parseFloat(raw.replace(',', '.'))
    return !isNaN(f) ? Math.round(f * 100).toString() : raw
  }

  // Helper para preservar el espaciado
  const padCell = (content: string, width = 3): string => {
    return ` ${content} `.padEnd(width, ' ')
  }

  let updated = false
  const newLines = lines.map((line, index) => {
    if (index <= tableStartIndex + 1) return line
    if (!line.trim().startsWith('|')) return line

    const cells = splitByPipe(line)
    if (cells[kwIdx]?.toLowerCase() !== kw.toLowerCase()) return line

    if (volumeIdx !== -1) cells[volumeIdx] = padCell(result.volume.replace(/\D/g, ''), 8)
    if (difficultyIdx !== -1) cells[difficultyIdx] = padCell(compToPercent(result.competency), 10)
    if (relatedIdx !== -1) cells[relatedIdx] = padCell(result.relatedSearches, 20)
    if (sourceIdx !== -1) cells[sourceIdx] = padCell('DinoRank', 10)
    if (countryIdx !== -1 && !cells[countryIdx]?.trim()) cells[countryIdx] = padCell(country, 10)
    if (langIdx !== -1 && !cells[langIdx]?.trim()) cells[langIdx] = padCell(language, 10)

    updated = true
    return '|' + cells.join('|') + '|'
  })

  if (!updated && headers.length > 0) {
    // La keyword no estaba en la tabla — añadir fila al final
    const endIdx = newLines.findIndex(
      (line, i) => i > tableStartIndex + 1 && !line.trim().startsWith('|') && line.trim() !== '',
    )
    const injectIdx = endIdx === -1 ? newLines.length : endIdx
    const newRow = Array(headers.length).fill('   ')
    newRow[kwIdx] = padCell(kw, Math.max(kw.length + 2, 20))
    if (volumeIdx !== -1) newRow[volumeIdx] = padCell(result.volume.replace(/\D/g, ''), 8)
    if (difficultyIdx !== -1) newRow[difficultyIdx] = padCell(compToPercent(result.competency), 10)
    if (relatedIdx !== -1) newRow[relatedIdx] = padCell(result.relatedSearches, 20)
    if (sourceIdx !== -1) newRow[sourceIdx] = padCell('DinoRank', 10)
    if (countryIdx !== -1) newRow[countryIdx] = padCell(country, 10)
    if (langIdx !== -1) newRow[langIdx] = padCell(language, 10)
    newLines.splice(injectIdx, 0, '|' + newRow.join('|') + '|')
  }

  return newLines.join('\n')
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = resolveArgs()
  if (!args) {
    console.error('Uso: pnpm scrape:dinorank "tu palabra clave" [--country=es] [--debug]')
    process.exit(1)
  }

  let { keyword, country, debug } = args
  let language = 'es'

  // Pre-cargar país e idioma desde keywords.md si existe y está definido ahí
  if (existsSync(KEYWORDS_FILE)) {
    try {
      const content = readFileSync(KEYWORDS_FILE, 'utf-8')
      const lines = content.split(/\r?\n/)
      const tableStartIndex = lines.findIndex((line) => line.trim().startsWith('|'))
      if (tableStartIndex !== -1) {
        const headers = splitByPipe(lines[tableStartIndex]!).map((h) =>
          h
            .trim()
            .toLowerCase()
            .replace(/[\s.]+/g, '_'),
        )
        const kwIdx = headers.indexOf('keyword')
        const countryIdx = headers.indexOf('country')
        const langIdx = headers.indexOf('language')

        if (kwIdx !== -1) {
          for (let i = tableStartIndex + 2; i < lines.length; i++) {
            const line = lines[i]!
            if (!line.trim().startsWith('|')) continue
            const cells = splitByPipe(line)
            if (cells[kwIdx]?.toLowerCase() === keyword.toLowerCase()) {
              if (countryIdx !== -1) {
                const fileCountry = cells[countryIdx]?.trim()
                if (fileCountry) country = fileCountry.toLowerCase()
              }
              if (langIdx !== -1) {
                const fileLang = cells[langIdx]?.trim()
                if (fileLang) language = fileLang.toLowerCase()
              }
              break
            }
          }
        }
      }
    } catch (e) {
      // Ignorar errores de parseo inicial
    }
  }

  p.intro('🦖 Scrape DinoRank — Keyword Research')
  p.log.info(`Keyword: "${keyword}"  |  País: ${country}`)
  log('info', 'MAIN', 'Inicio', { keyword, country })

  const cache = loadCache()
  const cacheKey = `${keyword.toLowerCase()}_${country}`
  const cachedData = cache[cacheKey]

  let results: KWCacheEntry[] = []

  if (cachedData && isCacheValid(cachedData.timestamp)) {
    p.log.success('Datos obtenidos de caché local (< 30 días).')
    log('info', 'CACHE', 'Hit de caché', { keyword })
    results = [cachedData]
  } else {
    const s = p.spinner()
    s.start('Iniciando extracción con DinoRank...')
    const dinoState = loadState()

    try {
      results = await scrapeWithRetry(keyword, country, dinoState, args.useAI)
      s.stop('Extracción completada.')
      for (const res of results) {
        const cKey = `${res.keyword.toLowerCase()}_${res.country || country}`
        cache[cKey] = res
      }
      saveCache(cache)
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
      ...results.slice(0, 3).map((r) => `  - ${r.keyword} (${r.volume} vol)`),
      results.length > 3 ? `  ...y ${results.length - 3} sugerencias más` : '',
      ``,
      `Historial local: ${historyCount} ${historyCount === 1 ? 'entrada' : 'entradas'} en ${KW_HISTORY_FILE.replace(ROOT + '/', '')}`,
    ]
      .filter(Boolean)
      .join('\n'),
    'Resultados',
  )

  if (existsSync(KEYWORDS_FILE)) {
    let content = readFileSync(KEYWORDS_FILE, 'utf-8')
    for (const res of results) {
      content = updateMarkdownTable(content, res.keyword, res, res.country || country, language)
    }
    writeFileSync(KEYWORDS_FILE, content)
    p.log.success(`keywords.md actualizado con ${results.length} entradas.`)
    log('info', 'MAIN', 'keywords.md actualizado', { keyword, added: results.length })
  } else {
    p.log.warn(`No se encontró el archivo ${KEYWORDS_FILE}`)
  }

  p.outro('✅ Finalizado')
}

if (process.env.NODE_ENV !== 'test') {
  main().catch((err) => {
    console.error('FATAL:', err)
    process.exit(1)
  })
}
