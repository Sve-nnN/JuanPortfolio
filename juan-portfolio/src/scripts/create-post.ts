#!/usr/bin/env tsx
/**
 * create-post.ts — Automatizador de creación de contenido SEO
 *
 * Uso: pnpm create-post [--provider=anthropic|openai|gemini] [--re-export]
 */

import * as p from '@clack/prompts'
import { chromium, type Page } from 'playwright'
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'
import TurndownService from 'turndown'
import matter from 'gray-matter'
import { globSync } from 'glob'
import { createAdapter, type LlmAdapter, type LlmProvider } from './create-post/llm-adapters'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '../..')

// ─── Constantes ───────────────────────────────────────────────────────────────

const DINORANK_STATE_FILE = join(ROOT, 'content/dinorank-state.json')
const DINORANK_SESSION_FILE = join(ROOT, 'content/dinorank-session.json')
const KEYWORDS_FILE = join(ROOT, 'content/keywords.md')
const POSTS_DIR = join(ROOT, 'content/posts')
const LOGS_DIR = join(ROOT, 'logs')
const LOG_FILE = join(LOGS_DIR, 'create-post.log')
const MAX_POSTS_PER_ACCOUNT = 5

const DINORANK_REGISTER_URL = 'https://dinorank.com/registro/?codPromo=dinoTrial25'
const DINORANK_LOGIN_URL = 'https://dinorank.com/login/'
const DINORANK_BRAIN_URL = 'https://dinorank.com/dinobrain/'

export const CATEGORY_LABELS: Record<string, string> = {
  seo: 'SEO',
  'tech-seo': 'Tech SEO',
  development: 'Development',
  'cs-fundamentals': 'CS Fundamentals',
}

const DEFAULT_WRITING_INSTRUCTIONS = `ROL: Eres Juan Carlos Angulo, Senior Tech SEO Analyst e Ingeniero de Software con más de 7 años de experiencia. Escribes para el blog "Juan Tech". Tu objetivo es demostrar un E-E-A-T profundo: combinas arquitectura de software (estructuras de datos, complejidad algorítmica, Next.js, PayloadCMS) con su impacto directo en motores de búsqueda (renderizado, Crawl Budget, Core Web Vitals).

AUDIENCIA: Va desde principiantes en SEO hasta ingenieros Senior y dueños de negocios B2B. Explica conceptos técnicos complejos de forma que cualquiera los entienda, sin perder el rigor que un perfil Senior espera.

TONO Y VOZ:
- Formal, informativo y cercano. Escribe como un consultor técnico hablándole a un colega.
- Sin humor, sin ironía, sin analogías infantiles. Enfoque 100% didáctico y orientado a la resolución de problemas.
- Concisión extrema: cada oración aporta un dato, una instrucción o un concepto. Si puedes decirlo en 10 palabras, no uses 20.
- Voz activa en primera persona del singular ("Recomiendo", "He notado") o plural inclusivo ("Vamos a analizar", "Implementaremos").

LISTA NEGRA — NUNCA uses:
- Adjetivos superlativos: increíble, fantástico, revolucionario, mágico, asombroso, brutal, maravilloso, definitivo.
- Introducciones largas: no empieces con "En el dinámico mundo de...", "Hoy en día es más importante que nunca...", "En la era de la IA...".
- Lenguaje de ventas: tono neutro, basado en datos y lógica técnica.
- Frases genéricas: "en el mundo digital de hoy", "en los últimos años", "como todos sabemos".

ESTRUCTURA:
- Empieza directamente con el H1 del artículo, sin texto previo.
- Párrafos cortos: máximo 3-4 líneas.
- Usa listas (viñetas) siempre que haya más de dos elementos secuenciales.
- Negrita solo para conceptos técnicos clave o la idea central de un párrafo.
- Sustenta afirmaciones con lógica de programación o principios de arquitectura web.
- Estructura: problema/concepto directo → desarrollo técnico con H2/H3 → conclusión con siguiente paso accionable.

SEO:
- Keyword principal en el primer párrafo, en al menos 2 H2 y en la conclusión.
- Densidad natural, sin keyword stuffing.
- Longitud: entre 2000 y 3000 palabras.
- Añade FAQ al final si encaja con la intención de búsqueda.

AUDITORÍA INTERNA: Antes de entregar el texto, revísalo. Si suena genérico, a marketing o tiene exceso de adjetivos, reescríbelo para que sea técnico, frío, claro y directo.`

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface HistoryEntry {
  keyword: string
  slug: string
  category: string
  title: string
  html: string
  markdown: string
  createdAt: string
  accountEmail: string
}

export interface DinoRankAccount {
  email: string
  password: string
  postsGenerated: number
  createdAt: string
  lastUsed: string
}

export interface DinoRankState {
  accounts: DinoRankAccount[]
  currentAccountIndex: number
  history: HistoryEntry[]
}

export interface KeywordData {
  keyword: string
  targetUrl: string
  category: string
  slug: string
  volume: string
  difficulty: string
  intent: string
  status: string
  relatedSearches: string
  paaQuestions: string
  competitorHeadings: string
  competitorMeta: string
  avgWordCount: string
  clusterType: string
  filePath: string
  fileExists: boolean
}

// ─── Utils ───────────────────────────────────────────────────────────────────

function log(level: 'info' | 'warn' | 'error', step: string, msg: string, data?: unknown): void {
  try {
    if (!existsSync(LOGS_DIR)) mkdirSync(LOGS_DIR, { recursive: true })
    const entry = JSON.stringify({ ts: new Date().toISOString(), level, step, msg, ...(data !== undefined ? { data } : {}) })
    appendFileSync(LOG_FILE, entry + '\n', 'utf-8')
  } catch {}
}

interface ArgResult {
  provider: LlmProvider
  debug: boolean
  keyword?: string
  reExport: boolean
}

function resolveArgs(): ArgResult {
  const argv = process.argv.slice(2).filter((a) => a !== '--')
  let provider: LlmProvider = (process.env.LLM_PROVIDER as LlmProvider) ?? 'anthropic'
  let debug = false, keyword: string | undefined, reExport = false
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!
    if (arg.startsWith('--provider=')) provider = arg.slice('--provider='.length) as LlmProvider
    else if (arg === '--provider' && argv[i + 1]) provider = argv[++i] as LlmProvider
    else if (arg === '--debug') { debug = true; DEBUG_MODE = true }
    else if (arg === '--re-export') reExport = true
    else if (arg.startsWith('--keyword=')) keyword = arg.slice('--keyword='.length)
    else if (arg === '--keyword' && argv[i + 1]) keyword = argv[++i]
  }
  return { provider, debug, keyword, reExport }
}

let DEBUG_MODE = false

export function randomStr(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function randomPassword(): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', lower = 'abcdefghijklmnopqrstuvwxyz', digits = '0123456789', special = '!@#$'
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)]
  const base = [ pick(upper), pick(upper), pick(lower), pick(lower), pick(lower), pick(digits), pick(digits), pick(special) ]
  for (let i = base.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [base[i], base[j]] = [base[j]!, base[i]!] }
  return base.join('') + randomStr(4)
}

async function createDinoRankAccount(): Promise<{ email: string; password: string }> {
  const email = `${randomStr(8)}${randomStr(4)}@gmail.com`, password = randomPassword()
  p.log.info(`Nueva cuenta: ${email}`); log('info', 'ACCOUNT', 'Creando nueva cuenta DinoRank', { email })
  const browser = await chromium.launch({ headless: false, slowMo: 120 }), page = await browser.newPage()
  try {
    await page.goto(DINORANK_REGISTER_URL, { waitUntil: 'domcontentloaded' })
    await page.locator('#usuarior').fill(email); await page.locator('#telefonor').fill('+34666000000'); await page.locator('#passwordr').fill(password); await page.locator('#passwordr2').fill(password)
    if (!(await page.locator('#aceptoPrivacidad').isChecked())) await page.locator('#aceptoPrivacidad').check()
    p.note('Completa el registro manualmente si hay CAPTCHA y pulsa continuar.', 'Acción requerida')
    const confirmed = await p.confirm({ message: '¿Registro completado?' })
    if (p.isCancel(confirmed) || !confirmed) throw new Error('Registro cancelado')
  } finally { await browser.close() }
  return { email, password }
}

async function dumpDebugInfo(page: Page, step: string): Promise<void> {
  if (!DEBUG_MODE) return
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-'), screenshotPath = `/tmp/dinobrain-debug-${step}-${timestamp}.png`
  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {})
  const info = await page.evaluate(() => ({
    url: window.location.href, title: document.title,
    buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t => t),
    inputs: Array.from(document.querySelectorAll('input')).map(i => ({ id: i.id, name: i.name, type: i.type, value: i.value })),
    visibleText: document.body.innerText.substring(0, 1000)
  }))
  console.log(`[DEBUG: ${step}]`, JSON.stringify(info, null, 2))
}

async function clearOverlays(page: Page): Promise<void> {
  const swalOk = page.locator('.swal2-confirm, .swal-button--confirm').first()
  if (await swalOk.isVisible()) { await swalOk.click().catch(() => {}); await page.waitForTimeout(500) }
  await page.keyboard.press('Escape').catch(() => {})
  await page.evaluate(() => {
    const overlays = ['.swal2-container', '.modal-backdrop', '#ventanaCompra', '.popup-overlay']
    overlays.forEach((sel) => { const el = document.querySelector(sel) as HTMLElement; if (el) el.style.display = 'none' })
  }).catch(() => {})
}

// ─── DinoRank Account State ───────────────────────────────────────────────────

export function loadState(statePath = DINORANK_STATE_FILE): DinoRankState {
  if (!existsSync(statePath)) return { accounts: [], currentAccountIndex: 0, history: [] }
  const state = JSON.parse(readFileSync(statePath, 'utf-8')) as DinoRankState
  if (!state.history) state.history = []
  return state
}

export function saveState(state: DinoRankState, statePath = DINORANK_STATE_FILE): void {
  writeFileSync(statePath, JSON.stringify(state, null, 2))
}

export function getActiveAccount(state: DinoRankState): DinoRankAccount | null {
  if (state.accounts.length === 0) return null
  const acc = state.accounts[state.currentAccountIndex]
  if (!acc || acc.postsGenerated >= MAX_POSTS_PER_ACCOUNT) return null
  return acc
}

export function registerAccount(state: DinoRankState, email: string, password: string): void {
  state.accounts.push({ email, password, postsGenerated: 0, createdAt: new Date().toISOString().split('T')[0]!, lastUsed: new Date().toISOString().split('T')[0]! })
  state.currentAccountIndex = state.accounts.length - 1
}

export function incrementPostCount(state: DinoRankState): void {
  const acc = state.accounts[state.currentAccountIndex]; if (acc) { acc.postsGenerated++; acc.lastUsed = new Date().toISOString().split('T')[0]! }
}

export function addToHistory(state: DinoRankState, entry: HistoryEntry): void {
  state.history = state.history.filter((h) => h.keyword !== entry.keyword)
  state.history.unshift(entry); if (state.history.length > 100) state.history.pop()
}

// ─── Keywords Parser ──────────────────────────────────────────────────────────

export function parseKeywords(content: string, postsDir = POSTS_DIR): KeywordData[] {
  const lines = content.split('\n'), headerIdx = lines.findIndex((l) => l.startsWith('| Keyword'))
  if (headerIdx === -1) throw new Error('No se encontró la tabla de keywords')
  const headers = lines[headerIdx]!.split('|').map((h) => h.trim().toLowerCase().replace(/[\s.]+/g, '_')).filter(Boolean)
  const getCol = (cols: string[], name: string): string => { const idx = headers.indexOf(name); return idx >= 0 && idx < cols.length ? (cols[idx] ?? '').trim() : '' }
  const dataLines = lines.slice(headerIdx + 2).filter((l) => l.startsWith('|'))
  return dataLines.map((line) => {
    const cols = line.split('|').map((c) => c.trim()).slice(1, headers.length + 1)
    const keyword = getCol(cols, 'keyword'), targetUrl = getCol(cols, 'target_url')
    if (!keyword || !targetUrl || targetUrl === ':---') return null
    const parts = targetUrl.replace(/^\//, '').split('/'), category = parts[0] ?? '', slug = parts[parts.length - 1] ?? ''
    if (!category || !slug) return null
    const filePath = join(postsDir, category, `${slug}.md`)
    return {
      keyword, targetUrl, category, slug, volume: getCol(cols, 'volume'), difficulty: getCol(cols, 'difficulty'), intent: getCol(cols, 'intent'), status: getCol(cols, 'status'),
      relatedSearches: getCol(cols, 'related_searches'), paaQuestions: getCol(cols, 'paa_questions'), competitorHeadings: getCol(cols, 'competitor_headings'), competitorMeta: getCol(cols, 'competitor_meta'),
      avgWordCount: getCol(cols, 'avg__word_count'), clusterType: getCol(cols, 'cluster_type'), filePath, fileExists: existsSync(filePath),
    }
  }).filter((k): k is KeywordData => k !== null)
}

// ─── Browser: helpers ─────────────────────────────────────────────────────────

async function saveSession(page: Page): Promise<void> {
  const cookies = await page.context().cookies(); writeFileSync(DINORANK_SESSION_FILE, JSON.stringify(cookies, null, 2))
}

async function restoreSession(page: Page): Promise<boolean> {
  if (!existsSync(DINORANK_SESSION_FILE)) return false
  try {
    const cookies = JSON.parse(readFileSync(DINORANK_SESSION_FILE, 'utf-8'))
    await page.context().addCookies(cookies); await page.goto(DINORANK_BRAIN_URL, { waitUntil: 'domcontentloaded', timeout: 20_000 })
    return !page.url().includes('/login')
  } catch { return false }
}

async function loginToDinoRank(page: Page, email: string, password: string): Promise<void> {
  await page.goto(DINORANK_LOGIN_URL, { waitUntil: 'domcontentloaded' })
  await page.locator('#usuario').fill(email); await page.locator('#password').fill(password); await page.locator('#botonLogin').click()
  await page.waitForTimeout(2500); if (!page.url().includes('/login')) await saveSession(page)
}

enum BrainState { NEEDS_LOGIN = 'NEEDS_LOGIN', BRAIN_INPUT_EMPTY = 'BRAIN_INPUT_EMPTY', BRAIN_INPUT_FILLED = 'BRAIN_INPUT_FILLED', NO_CREDITS_TABLE_VISIBLE = 'NO_CREDITS_TABLE_VISIBLE', OVERLAY_VISIBLE = 'OVERLAY_VISIBLE', GENERATION_PROGRESS = 'GENERATION_PROGRESS', GENERATION_FINISHED = 'GENERATION_FINISHED', UNKNOWN = 'UNKNOWN' }

async function detectState(page: Page, targetKeyword: string, keywordEntered: boolean): Promise<BrainState> {
  const url = page.url(); if (url.includes('/login')) return BrainState.NEEDS_LOGIN
  const overlayVisible = await page.evaluate(() => { const swal = document.querySelector('.swal2-container') as HTMLElement; return !!(swal && swal.offsetParent !== null) })
  if (overlayVisible) return BrainState.OVERLAY_VISIBLE
  const hasContent = await page.evaluate(() => { const editor = document.querySelector('.ql-editor') as HTMLElement; return editor && editor.innerText.trim().length > 500 })
  if (hasContent) return BrainState.GENERATION_FINISHED
  const copyBtn = page.locator('button[onclick*="copiarPortapapelesDiv"]').first(); if (await copyBtn.isVisible().catch(() => false)) return BrainState.GENERATION_FINISHED
  const progress = await page.evaluate(() => { const body = document.body.innerText.toLowerCase(); return body.includes('analizando') || body.includes('redactando') || body.includes('cerebro de dinobrain') })
  if (progress) return BrainState.GENERATION_PROGRESS
  if (url.includes('/dinobrain')) {
    const kwInput = page.locator('#keyword, input[name="keyword"]').first(), table = page.locator('#tablacontenidosgenerados').first()
    if (await kwInput.count() > 0 && await kwInput.isVisible()) { const val = await kwInput.inputValue(); return val.trim().length >= 3 ? BrainState.BRAIN_INPUT_FILLED : BrainState.BRAIN_INPUT_EMPTY }
    else if (await table.count() > 0 && await table.isVisible()) return BrainState.NO_CREDITS_TABLE_VISIBLE
  }
  return BrainState.UNKNOWN
}

async function generateContentWithDinoBrain(keyword: string, instructions: string, account: DinoRankAccount): Promise<{ html: string; markdown: string; title: string }> {
  const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' }), browser = await chromium.launch({ headless: false, slowMo: 100 }), page = await browser.newPage()
  let html = '', title = '', state = BrainState.UNKNOWN, keywordEntered = false
  try {
    const sessionOk = await restoreSession(page); if (!sessionOk) await page.goto(DINORANK_LOGIN_URL); else await page.goto(DINORANK_BRAIN_URL)
    for (let i = 0; i < 60; i++) {
      await page.waitForTimeout(1500); state = await detectState(page, keyword, keywordEntered)
      switch (state) {
        case BrainState.NEEDS_LOGIN: await loginToDinoRank(page, account.email, account.password); await page.goto(DINORANK_BRAIN_URL); break
        case BrainState.OVERLAY_VISIBLE: const confirmBtn = page.locator('.swal2-confirm, .swal-button--confirm').first(); if (await confirmBtn.isVisible()) await confirmBtn.click({ force: true }); else await clearOverlays(page); break
        case BrainState.BRAIN_INPUT_EMPTY: await page.locator('#keyword').fill(keyword); if (instructions.trim()) { await page.locator('button[onclick*="despliegaContexto"]').first().click(); await page.waitForTimeout(500); await page.locator('#textoContextoSimple').fill(instructions) } break
        case BrainState.BRAIN_INPUT_FILLED: case BrainState.NO_CREDITS_TABLE_VISIBLE:
          const found = await page.evaluate((kw) => {
            const rows = document.querySelectorAll('#tablabodycontenidos tr')
            for (const row of rows) {
              const rowText = row.textContent?.toLowerCase() || '', hiddenVal = (row.querySelector('input[type="hidden"]') as HTMLInputElement)?.value?.toLowerCase() || ''
              if (rowText.includes(kw.toLowerCase()) || hiddenVal.includes(kw.toLowerCase())) { (row.querySelector('button[onclick*="obtieneContenido"]') as HTMLElement)?.click(); return true }
            }
            return false
          }, keyword)
          if (found) { keywordEntered = true; break }
          if (state === BrainState.NO_CREDITS_TABLE_VISIBLE) throw new Error(`✗ No quedan créditos y la keyword "${keyword}" no está en el historial.`)
          if (keywordEntered) break; await page.evaluate(() => (document.querySelector('button[onclick*="dinoBrain()"]') as HTMLElement)?.click()); keywordEntered = true; break
        case BrainState.GENERATION_FINISHED: await page.waitForTimeout(3000)
          const data = await page.evaluate(() => {
            const editor = document.querySelector('.ql-editor') as HTMLElement; let h = editor?.innerHTML || ''
            if (!h) { const copyBtn = document.querySelector('button[onclick*="copiarPortapapelesDiv"]'), m = copyBtn?.getAttribute('onclick')?.match(/'([^']+)'/); if (m?.[1]) h = document.getElementById(m[1])?.innerHTML ?? '' }
            if (!h) h = document.querySelector('#textodelcontenido')?.innerHTML || ''; const temp = document.createElement('div'); temp.innerHTML = h; return { html: h, title: temp.querySelector('h1')?.innerText || temp.querySelector('h2')?.innerText || '' }
          })
          html = data.html; title = data.title; if (html.length > 500) i = 100; break
      }
      if (html.length > 500) break
    }
    if (!html) throw new Error('No se pudo extraer el contenido.')
    await saveSession(page)
  } finally { await browser.close() }
  return { html, markdown: turndownService.turndown(html), title }
}

// ─── Content Processing ───────────────────────────────────────────────────────

export function processContent(raw: string): { extractedTitle: string; body: string } {
  const lines = raw.split('\n'); let extractedTitle = ''
  for (let i = 0; i < lines.length; i++) { const line = lines[i]!.trim(); if (line.startsWith('# ')) { extractedTitle = line.replace(/^#\s+/, '').trim(); break } }
  if (!extractedTitle) { for (let i = 0; i < lines.length; i++) { if (lines[i]!.trim()) { extractedTitle = lines[i]!.trim().replace(/^#+\s*/, ''); break } } }
  const bodyLines = lines.filter(l => !l.trim().startsWith('# ')); return { extractedTitle, body: bodyLines.join('\n').trim() }
}

// ─── LLM: Frontmatter Builder ─────────────────────────────────────────────────

async function buildFrontmatter(adapter: LlmAdapter, kw: KeywordData, extractedTitle: string, body: string, existingPosts: {slug: string, role: string}[]): Promise<string> {
  const pillars = existingPosts.filter(p => p.role === 'pillar').map(p => p.slug);
  const otherSlugs = existingPosts.map(p => p.slug);
  const prompt = `Eres un experto en SEO técnico y arquitectura de contenidos. Genera el frontmatter YAML para este artículo.
DATOS:
- Keyword: ${kw.keyword} | Intención: ${kw.intent} | Cluster: ${kw.clusterType} | Categoría: ${kw.category}
TÍTULO EXTRAÍDO: ${extractedTitle}
CONTENIDO (extracto): ${body.substring(0, 1000)}
PILARES: ${pillars.join(', ')}
OTROS SLUGS: ${otherSlugs.slice(0, 40).join(', ')}

REGLAS:
1. title: SEO-optimizado, max 60 chars.
2. tldr: 40-50 palabras, con Information Gain, formato multi-línea (>).
3. contentRole: 'pillar' (si guía maestra >3000 palabras) o 'satellite' (tema específico).
4. pillarSlug: Si 'satellite', indica el pilar más relacionado de la lista. Si no hay claro o es pilar, usa null.
5. primary_keywords: Array con 3-4 variantes directas de la keyword principal.
6. semantic_keywords: Array con 5-8 términos LSI/semánticos.
7. relatedPosts: Array con 2-3 slugs de la lista.

YAML FORMAT:
---
title: '...'
tldr: >-
  ...
metaTitle: '...'
metaDescription: '...'
primary_keywords:
  - keyword 1
semantic_keywords:
  - término 1
contentRole: satellite
pillarSlug: slug-del-pilar
relatedPosts:
  - slug-1
---`;
  return adapter.generateFrontmatter(prompt)
}

export function assemblePost(aiYaml: string, kw: KeywordData, body: string): string {
  const now = new Date().toISOString(), categoryTitle = CATEGORY_LABELS[kw.category] ?? kw.category
  const fmMatch = aiYaml.match(/^---\n([\s\S]*?)\n---/); let aiFields = fmMatch ? fmMatch[1]! : aiYaml.replace(/^---\n?|---\n?$/g, '')
  const fieldsToStrip = ['publishedAt', 'updatedAt', 'authors', 'heroImage', 'categoryTitle', 'slug', 'idioma', 'sidebarBanners', 'uploaded']
  fieldsToStrip.forEach(f => aiFields = aiFields.replace(new RegExp(`^${f}:.*\\n?`, 'gm'), ''))
  const fixedFields = [`publishedAt: '${now}'`, `updatedAt: '${now}'`, `authors: [juan-carlos-angulo]`, `heroImage: null`, `categoryTitle: ${categoryTitle}`, `slug: ${kw.slug}`, `idioma: es`, `sidebarBanners: []`, `uploaded: false`].join('\n')
  return `---\n${aiFields.trim()}\n${fixedFields}\n---\n\n${body.trim()}\n`
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = resolveArgs(); DEBUG_MODE = args.debug; p.intro('🦖 Create Post — Automatizador DinoRank')
  const state = loadState(), keywords = parseKeywords(readFileSync(KEYWORDS_FILE, 'utf-8')), adapter = createAdapter(args.provider)
  const existingFiles = globSync('content/posts/**/*.md'), existingPosts = existingFiles.map(f => {
    try { const { data } = matter(readFileSync(f, 'utf-8')); return { slug: data.slug || '', role: data.contentRole || '' } } catch { return null }
  }).filter((p): p is {slug: string, role: string} => !!p && !!p.slug)

  let kw: KeywordData | undefined, markdownBody = '', extractedTitle = ''
  if (args.reExport) {
    if (state.history.length === 0) { p.log.warn('No hay historial.'); process.exit(0) }
    const sel = await p.select({ message: 'Re-exportar:', options: state.history.map((h, i) => ({ value: i, label: `${h.keyword} (${h.createdAt})`, hint: h.title })) })
    if (p.isCancel(sel)) process.exit(0); const entry = state.history[sel as number]!; kw = keywords.find(k => k.slug === entry.slug || k.keyword === entry.keyword)
    if (!kw) { p.log.error('Keyword no encontrada en MD.'); process.exit(1) }
    markdownBody = entry.markdown; extractedTitle = entry.title
  } else {
    const available = keywords.filter(k => !k.fileExists && k.category && k.slug).sort((a, b) => (parseInt(b.volume) || 0) - (parseInt(a.volume) || 0))
    let choice = args.keyword; if (!choice) {
      const selected = await p.select({ message: 'Selecciona keyword:', options: available.slice(0, 40).map(k => ({ value: k.slug, label: k.keyword, hint: k.category })) })
      if (p.isCancel(selected)) process.exit(0); choice = selected as string
    }
    kw = keywords.find(k => k.slug === choice || k.keyword === choice); if (!kw) process.exit(1)
    let acc = getActiveAccount(state); if (!acc) { const newAcc = await createDinoRankAccount(); registerAccount(state, newAcc.email, newAcc.password); saveState(state); acc = getActiveAccount(state)! }
    const { html, markdown, title } = await generateContentWithDinoBrain(kw.keyword, DEFAULT_WRITING_INSTRUCTIONS, acc)
    markdownBody = markdown; extractedTitle = title; incrementPostCount(state)
    addToHistory(state, { keyword: kw.keyword, slug: kw.slug, category: kw.category, title, html, markdown, createdAt: new Date().toISOString().split('T')[0]!, accountEmail: acc.email }); saveState(state)
  }

  const processed = processContent(markdownBody); if (!extractedTitle) extractedTitle = processed.extractedTitle; markdownBody = processed.body
  const s = p.spinner(); s.start('Generando frontmatter...')
  try {
    const aiYaml = await buildFrontmatter(adapter, kw!, extractedTitle, markdownBody, existingPosts)
    s.stop('Listo'); const fileContent = assemblePost(aiYaml, kw!, markdownBody), categoryDir = join(POSTS_DIR, kw!.category)
    if (!existsSync(categoryDir)) mkdirSync(categoryDir, { recursive: true })
    writeFileSync(kw!.filePath, fileContent); p.log.success(`Guardado: ${kw!.filePath}`)
    spawnSync('pnpm', ['sync', 'push', '--', `--post=${kw!.category}/${kw!.slug}.md`], { cwd: ROOT, stdio: 'inherit', shell: true })
  } catch (err) { s.stop('Error'); p.log.error(String(err)) }
  p.outro('✅ Finalizado')
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(__filename)) { main().catch(err => { console.error('FATAL:', err); process.exit(1) }) }
