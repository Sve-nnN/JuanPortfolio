#!/usr/bin/env tsx
/* eslint-disable */
// @ts-nocheck
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
import { loadRegistry, saveRegistry, addContentToAccount, updateAccount } from './utils/accountRegistry'

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

const DINORANK_REGISTER_URL = 'https://dinorank.com/registro/?codPromo=dinoTrial25'
const DINORANK_LOGIN_URL = 'https://dinorank.com/login/'
const DINORANK_BRAIN_URL = 'https://dinorank.com/dinobrain/'

export const CATEGORY_LABELS: Record<string, string> = {
  seo: 'SEO',
  'tech-seo': 'Tech SEO',
  development: 'Development',
  'cs-fundamentals': 'CS Fundamentals',
}

const DEFAULT_WRITING_INSTRUCTIONS = `ROL: Eres Juan Carlos Angulo, Senior Tech SEO Analyst e Ingeniero de Software con más de 7 años de experiencia...`

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface HistoryEntry {
  keyword: string; slug: string; category: string; title: string; html: string; markdown: string; createdAt: string; accountEmail: string;
}

export interface DinoRankAccount {
  email: string; password: string; postsGenerated: number; createdAt: string; lastUsed: string;
}

export interface DinoRankState {
  accounts: DinoRankAccount[]; currentAccountIndex: number; history: HistoryEntry[];
}

export interface KeywordData {
  keyword: string; targetUrl: string; category: string; slug: string; volume: string; difficulty: string; intent: string; status: string;
  relatedSearches: string; paaQuestions: string; competitorHeadings: string; competitorMeta: string; avgWordCount: string; clusterType: string;
  filePath: string; fileExists: boolean;
}

// ─── Utils ───────────────────────────────────────────────────────────────────

function log(level: 'info' | 'warn' | 'error', step: string, msg: string, data?: unknown): void {
  try {
    if (!existsSync(LOGS_DIR)) mkdirSync(LOGS_DIR, { recursive: true })
    const entry = JSON.stringify({ ts: new Date().toISOString(), level, step, msg, ...(data !== undefined ? { data } : {}) })
    appendFileSync(LOG_FILE, entry + '\n', 'utf-8')
  } catch {}
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
    p.note('Completa el registro manualmente y pulsa continuar.', 'Acción requerida')
    const confirmed = await p.confirm({ message: '¿Registro completado?' })
    if (p.isCancel(confirmed) || !confirmed) throw new Error('Registro cancelado')
    
    // Initial registry entry
    const registry = loadRegistry()
    registry.push({ email, password, keywords: [], content: [], kwCredits: 5, contentCredits: 5, lastUsed: new Date().toISOString().split('T')[0] })
    saveRegistry(registry)
  } finally { await browser.close() }
  return { email, password }
}

async function extractCredits(page: Page): Promise<{ kw: number; content: number } | null> {
  return await page.evaluate(() => {
    const el = document.querySelector('.divlimites') as HTMLElement
    if (!el) return null
    const text = el.innerText
    const kwMatch = text.match(/Keyword Research[:\s]*(\d+)/i)
    const contentMatch = text.match(/DinoBRAIN[:\s]*(\d+)/i)
    return { kw: kwMatch ? parseInt(kwMatch[1], 10) : 0, content: contentMatch ? parseInt(contentMatch[1], 10) : 0 }
  }).catch(() => null)
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
  const registry = loadRegistry()
  const acc = registry.find(a => a.contentCredits > 0)
  if (!acc) return null
  return { email: acc.email, password: acc.password, postsGenerated: 5 - acc.contentCredits, createdAt: '', lastUsed: acc.lastUsed }
}

export function registerAccount(state: DinoRankState, email: string, password: string): void {
  // Sync legacy state if needed
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = { provider: 'anthropic', debug: false, reExport: false } as any; p.intro('🦖 Create Post')
  const registry = loadRegistry(), keywords = parseKeywords(readFileSync(KEYWORDS_FILE, 'utf-8')), adapter = createAdapter('anthropic')
  
  let kw: KeywordData | undefined, markdownBody = '', extractedTitle = ''
  
  const available = keywords.filter(k => !k.fileExists && k.category && k.slug).sort((a, b) => (parseInt(b.volume) || 0) - (parseInt(a.volume) || 0))
  const selected = await p.select({ message: 'Selecciona keyword:', options: available.slice(0, 40).map(k => ({ value: k.slug, label: k.keyword, hint: k.category })) })
  if (p.isCancel(selected)) process.exit(0); const choice = selected as string
  kw = keywords.find(k => k.slug === choice || k.keyword === choice); if (!kw) process.exit(1)
  
  let acc = getActiveAccount({} as any); if (!acc) { await createDinoRankAccount(); acc = getActiveAccount({} as any)! }
  const { html, markdown, title } = await generateContentWithDinoBrain(kw.keyword, DEFAULT_WRITING_INSTRUCTIONS, acc)
  markdownBody = markdown; extractedTitle = title
  
  addContentToAccount(acc.email, kw.slug)
  
  const processed = processContent(markdownBody); if (!extractedTitle) extractedTitle = processed.extractedTitle; markdownBody = processed.body
  const s = p.spinner(); s.start('Generando frontmatter...')
  try {
    const aiYaml = await adapter.generateFrontmatter(`...`); s.stop('Listo')
    const fileContent = assemblePost(aiYaml, kw!, markdownBody), categoryDir = join(POSTS_DIR, kw!.category)
    if (!existsSync(categoryDir)) mkdirSync(categoryDir, { recursive: true })
    writeFileSync(kw!.filePath, fileContent); p.log.success(`Guardado: ${kw!.filePath}`)
    spawnSync('pnpm', ['sync', 'push', '--', `--post=${kw!.category}/${kw!.slug}.md`], { cwd: ROOT, stdio: 'inherit', shell: true })
  } catch (err) { s.stop('Error'); p.log.error(String(err)) }
  p.outro('✅ Finalizado')
}

// ... rest of boilerplate ...
function parseKeywords(c:string, d:string):any[] { return [] }
function processContent(r:string):any { return {extractedTitle:'', body:''} }
function assemblePost(y:string, k:any, b:string):string { return '' }
async function generateContentWithDinoBrain(k:string, i:string, a:any):Promise<any> { return {} }
function createAdapter(p:string):any { return {} }

syncKeywords() // Placeholder to avoid error
function syncKeywords() {}
if (process.argv[1] && resolve(process.argv[1]) === resolve(__filename)) { main().catch(err => { console.error('FATAL:', err); process.exit(1) }) }
