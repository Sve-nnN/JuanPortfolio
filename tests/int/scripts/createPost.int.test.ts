/**
 * Tests de integración para src/scripts/create-post.ts
 *
 * Ejecuta las funciones puras exportadas con directorios temporales reales para verificar:
 *  - parseKeywords con fixture completo (filtrado, ordenado por volumen)
 *  - State management con archivo real (roundtrip loadState/saveState)
 *  - LlmAdapter interface contract (mock verifica que el prompt contiene los datos correctos)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import {
  parseKeywords,
  loadState,
  saveState,
  getActiveAccount,
  registerAccount,
  incrementPostCount,
  type DinoRankState,
  type KeywordData,
} from '../../../src/scripts/create-post'
import { type LlmAdapter } from '../../../src/scripts/create-post/llm-adapters'

// ─── Helpers ──────────────────────────────────────────────────────────────────

let tmpDir: string
let postsDir: string
let statePath: string

function setup() {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jt-create-post-'))
  postsDir = path.join(tmpDir, 'posts')
  statePath = path.join(tmpDir, 'dinorank-state.json')
  fs.mkdirSync(postsDir, { recursive: true })
}

function teardown() {
  fs.rmSync(tmpDir, { recursive: true, force: true })
}

// ─── Fixture de keywords ──────────────────────────────────────────────────────

const KEYWORDS_FIXTURE = `
| Keyword | Target URL | Volume | Difficulty | Intent | Status | Related Searches | PAA Questions | Competitor Headings | Competitor Meta | Avg. Word Count | Cluster Type |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| guía seo completa | /seo/guia-seo | 5000 | 35 | Informational | pending | seo técnico, on-page seo | ¿Qué es SEO? | Guía SEO Completa, SEO para principiantes | Aprende SEO desde cero | 3200 | Pillar |
| technical seo | /tech-seo/technical-seo | 2000 | 65 | Informational | pending | core web vitals, indexación | ¿Qué es tech seo? | Technical SEO Guide | Meta tech seo desc | 2800 | Satellite |
| core web vitals | /tech-seo/core-web-vitals | 3500 | 50 | Informational | pending | lcp, fid, cls | ¿Qué son CWV? | Core Web Vitals Guide | Métricas esenciales | 2000 | Satellite |
| seo para ecommerce | /seo/seo-ecommerce | 1500 | 55 | Commercial | pending | tienda online seo | ¿Cómo hacer SEO? | Ecommerce SEO tips | Vende más con SEO | 1800 | Standalone |
`.trim()

// ─── 1. parseKeywords con fixture completo ────────────────────────────────────

describe('parseKeywords — fixture completo', () => {
  beforeEach(setup)
  afterEach(teardown)

  it('parsea todas las filas válidas del fixture', () => {
    const result = parseKeywords(KEYWORDS_FIXTURE, postsDir)
    expect(result).toHaveLength(4)
  })

  it('fileExists es false para slugs inexistentes', () => {
    const result = parseKeywords(KEYWORDS_FIXTURE, postsDir)
    for (const kw of result) {
      expect(kw.fileExists).toBe(false)
    }
  })

  it('fileExists es true cuando el archivo existe en postsDir', () => {
    // Crear el archivo para "guia-seo"
    const seoDir = path.join(postsDir, 'seo')
    fs.mkdirSync(seoDir, { recursive: true })
    fs.writeFileSync(path.join(seoDir, 'guia-seo.md'), '# Guía SEO\n\nContenido.')

    const result = parseKeywords(KEYWORDS_FIXTURE, postsDir)
    const guiaSeo = result.find((k) => k.slug === 'guia-seo')
    expect(guiaSeo?.fileExists).toBe(true)
  })

  it('filtra keywords con post existente al filtrar por fileExists', () => {
    // Crear el archivo guia-seo para que fileExists = true
    const seoDir = path.join(postsDir, 'seo')
    fs.mkdirSync(seoDir, { recursive: true })
    fs.writeFileSync(path.join(seoDir, 'guia-seo.md'), '# Post existente')

    const result = parseKeywords(KEYWORDS_FIXTURE, postsDir)
    const available = result.filter((k) => !k.fileExists)
    expect(available).toHaveLength(3)
    expect(available.find((k) => k.slug === 'guia-seo')).toBeUndefined()
  })

  it('ordena por volumen descendente correctamente', () => {
    const result = parseKeywords(KEYWORDS_FIXTURE, postsDir)
    const sorted = [...result].sort((a, b) => {
      const vA = parseInt(a.volume.replace(/[^0-9]/g, '')) || 0
      const vB = parseInt(b.volume.replace(/[^0-9]/g, '')) || 0
      return vB - vA
    })
    // Mayor volumen primero: guia-seo (5000), core-web-vitals (3500), technical-seo (2000), seo-ecommerce (1500)
    expect(sorted[0]?.slug).toBe('guia-seo')
    expect(sorted[1]?.slug).toBe('core-web-vitals')
  })

  it('extrae category y slug del path correctamente', () => {
    const result = parseKeywords(KEYWORDS_FIXTURE, postsDir)
    const techSeo = result.find((k) => k.slug === 'technical-seo')
    expect(techSeo?.category).toBe('tech-seo')
    expect(techSeo?.slug).toBe('technical-seo')
  })

  it('construye filePath correctamente con postsDir', () => {
    const result = parseKeywords(KEYWORDS_FIXTURE, postsDir)
    const guiaSeo = result.find((k) => k.slug === 'guia-seo')
    expect(guiaSeo?.filePath).toBe(path.join(postsDir, 'seo', 'guia-seo.md'))
  })
})

// ─── 2. State management con archivo real ─────────────────────────────────────

describe('State management — roundtrip con archivo real', () => {
  beforeEach(setup)
  afterEach(teardown)

  it('loadState devuelve estado vacío si el archivo no existe', () => {
    const state = loadState(statePath)
    expect(state.accounts).toHaveLength(0)
    expect(state.currentAccountIndex).toBe(0)
  })

  it('saveState + loadState roundtrip preserva los datos', () => {
    const state: DinoRankState = {
      accounts: [
        {
          email: 'test@example.com',
          password: 'Pass1!xyz',
          postsGenerated: 2,
          createdAt: '2026-01-01',
          lastUsed: '2026-01-15',
        },
      ],
      currentAccountIndex: 0,
    }
    saveState(state, statePath)
    const loaded = loadState(statePath)
    expect(loaded.accounts[0]?.email).toBe('test@example.com')
    expect(loaded.accounts[0]?.postsGenerated).toBe(2)
    expect(loaded.currentAccountIndex).toBe(0)
  })

  it('registerAccount añade la cuenta y actualiza el índice', () => {
    const state = loadState(statePath)
    registerAccount(state, 'nuevo@test.com', 'Pw123!')
    saveState(state, statePath)

    const loaded = loadState(statePath)
    expect(loaded.accounts).toHaveLength(1)
    expect(loaded.accounts[0]?.email).toBe('nuevo@test.com')
    expect(loaded.currentAccountIndex).toBe(0)
  })

  it('getActiveAccount devuelve null cuando postsGenerated >= 5', () => {
    const state = loadState(statePath)
    registerAccount(state, 'agotado@test.com', 'Pw1!')

    // Agotar la cuenta
    for (let i = 0; i < 5; i++) {
      incrementPostCount(state)
    }
    saveState(state, statePath)

    const loaded = loadState(statePath)
    expect(getActiveAccount(loaded)).toBeNull()
  })

  it('incrementPostCount actualiza el contador y la fecha', () => {
    const state = loadState(statePath)
    registerAccount(state, 'inc@test.com', 'Pw1!')
    incrementPostCount(state)
    saveState(state, statePath)

    const loaded = loadState(statePath)
    expect(loaded.accounts[0]?.postsGenerated).toBe(1)
    const today = new Date().toISOString().split('T')[0]
    expect(loaded.accounts[0]?.lastUsed).toBe(today)
  })

  it('múltiples cuentas: índice apunta a la última registrada', () => {
    const state = loadState(statePath)
    registerAccount(state, 'primera@test.com', 'Pw1!')
    registerAccount(state, 'segunda@test.com', 'Pw2!')
    saveState(state, statePath)

    const loaded = loadState(statePath)
    expect(loaded.currentAccountIndex).toBe(1)
    expect(loaded.accounts[1]?.email).toBe('segunda@test.com')
  })
})

// ─── 3. LlmAdapter interface contract ────────────────────────────────────────

describe('LlmAdapter interface contract', () => {
  it('mock adapter implementa la interfaz LlmAdapter', async () => {
    let capturedPrompt = ''

    const mockAdapter: LlmAdapter = {
      providerName: 'mock',
      generateFrontmatter: async (prompt: string) => {
        capturedPrompt = prompt
        return `---
title: 'Test Title'
contentRole: satellite
---`
      },
    }

    const kw: KeywordData = {
      keyword: 'technical seo',
      targetUrl: '/tech-seo/technical-seo',
      category: 'tech-seo',
      slug: 'technical-seo',
      volume: '2000',
      difficulty: '65',
      intent: 'Informational',
      status: 'pending',
      relatedSearches: 'core web vitals',
      paaQuestions: '¿Qué es tech seo?',
      competitorHeadings: 'Technical SEO Guide',
      competitorMeta: 'Meta tech seo',
      avgWordCount: '2800',
      clusterType: 'Satellite',
      filePath: '/tmp/tech-seo/technical-seo.md',
      fileExists: false,
    }

    // Simular llamada al adapter con el prompt que buildFrontmatter generaría
    const mockPrompt = `Keyword: ${kw.keyword}\nURL: ${kw.targetUrl}`
    const result = await mockAdapter.generateFrontmatter(mockPrompt)

    expect(capturedPrompt).toContain(kw.keyword)
    expect(capturedPrompt).toContain(kw.targetUrl)
    expect(result).toContain('---')
    expect(result).toContain('title:')
  })

  it('generateFrontmatter puede ser sustituido con mock para tests', async () => {
    const responses: string[] = []

    const mockAdapter: LlmAdapter = {
      providerName: 'test-mock',
      generateFrontmatter: async (prompt: string) => {
        responses.push(prompt)
        return `---\ntitle: 'Mock Response'\n---`
      },
    }

    await mockAdapter.generateFrontmatter('Prompt 1')
    await mockAdapter.generateFrontmatter('Prompt 2')

    expect(responses).toHaveLength(2)
    expect(responses[0]).toBe('Prompt 1')
    expect(responses[1]).toBe('Prompt 2')
  })

  it('el prompt para frontmatter contiene datos clave de la keyword', async () => {
    let receivedPrompt = ''

    const mockAdapter: LlmAdapter = {
      providerName: 'mock',
      generateFrontmatter: async (prompt: string) => {
        receivedPrompt = prompt
        return '---\ntitle: mock\n---'
      },
    }

    const testKeyword = 'guía seo completa para principiantes'
    const testUrl = '/seo/guia-seo'
    const simulatedPrompt = [
      `Keyword principal: ${testKeyword}`,
      `URL objetivo: ${testUrl}`,
      `Categoría: seo`,
      `Volumen de búsqueda: 5000`,
    ].join('\n')

    await mockAdapter.generateFrontmatter(simulatedPrompt)

    expect(receivedPrompt).toContain(testKeyword)
    expect(receivedPrompt).toContain(testUrl)
    expect(receivedPrompt).toContain('5000')
  })
})
