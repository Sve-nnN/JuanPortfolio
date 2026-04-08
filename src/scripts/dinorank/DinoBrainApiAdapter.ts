import { CONTENT_EXCLUSIONS, WRITING_INSTRUCTIONS } from '../config/engine-prompts'
import { loadRegistry, updateAccount, type AccountEntry } from '../utils/accountRegistry'
import { DinoRankApiClient } from './DinoRankApiClient'

const WRITING_INSTRUCTIONS_EN = `Role and Identity:
Act as Juan Carlos Angulo, a Senior Tech SEO Analyst and Software Engineer. You write for Juan Tech and must sound like a native English technical author.

Audience:
Write for developers, technical SEOs, and business owners. Explain complex topics clearly without reducing rigor.

Tone and Style:
- Professional, analytical, direct.
- No fluff.
- Use clear H2 and H3 headings.
- Keep the entire article in English.`

export interface DinoBrainParams {
  keyword: string
  country?: string
  language?: string
  siteType?: string
  domain?: string
  numWords?: number
  context?: string
  exclusions?: string
  pollingDelay?: number
}

export interface DinoBrainResult {
  title: string
  markdown: string
  accountEmail: string
}

type ScoredAccount = AccountEntry & { score: number }

type ProStructureNode = {
  title: string
  enabled: boolean
  length: string
  format_hint: string
  children: Array<{ title: string; enabled: boolean; format_hint: string }>
}

function normalizeAccountLanguage(value?: string): 'en' | 'es' | '' {
  const normalized = (value ?? '').trim().toLowerCase()
  if (!normalized) return ''
  if (normalized === 'en' || normalized.includes('english')) return 'en'
  if (normalized === 'es' || normalized.includes('spanish')) return 'es'
  return ''
}

export class DinoBrainApiAdapter {
  async generate(params: DinoBrainParams): Promise<DinoBrainResult> {
    const language = params.language ?? 'es'
    const normalizedLanguage = normalizeAccountLanguage(language) || (language.toLowerCase() === 'en' ? 'en' : 'es')
    const country = (params.country ?? 'ES').toUpperCase()
    const siteType = params.siteType ?? 'nicho'
    const domain = params.domain?.trim() || ''
    const numWords = params.numWords ?? 2000
    const pollingDelay = params.pollingDelay ?? 20_000

    const readyAccounts = this.pickAccounts(params, normalizedLanguage, country, siteType, domain)
    if (readyAccounts.length === 0) {
      if (normalizedLanguage === 'en') {
        throw new Error('No English DinoBrain accounts with content credits available. Create an English account before generating .en posts.')
      }
      throw new Error('No accounts with content credits available')
    }

    let lastError: unknown = null

    for (const account of readyAccounts) {
      const api = new DinoRankApiClient(account.email, account.password)

      try {
        const loginResult = await api.login(language)
        if (loginResult !== 'ok') {
          lastError = new Error(`Login failed for ${account.email}: ${loginResult}`)
          continue
        }

        const referer = language === 'en'
          ? 'https://dinorank.com/en/dinobrain/'
          : 'https://dinorank.com/dinobrain/'

        const brainHtml = await api.get(referer, referer)
        const availableCredits = api.extractContentCredits(brainHtml)
        if (availableCredits <= 0) {
          lastError = new Error(`No DinoBrain credits available for ${account.email}`)
          continue
        }

        const context = this.buildContext(params, language, country, siteType, domain)
        const exclusions = params.exclusions || CONTENT_EXCLUSIONS

        const idContenido = await this.generateViaProFlow(
          api,
          params.keyword,
          normalizedLanguage,
          referer,
          context,
          exclusions,
          numWords,
        )

        const finalHtml = await this.pollForResult(api, idContenido, params.keyword, referer, pollingDelay)
        const { title, markdown } = await this.extractBodyContent(finalHtml)
        const finalTitle = title || `Post sobre ${params.keyword}`

        updateAccount(account.email, {
          cooldownUntil: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        })

        return {
          title: finalTitle,
          markdown,
          accountEmail: account.email,
        }
      } catch (error) {
        lastError = error
      } finally {
        await api.logout().catch(() => undefined)
      }
    }

    if (lastError instanceof Error) {
      throw lastError
    }

    throw new Error('No DinoBrain account could complete generation')
  }

  private pickAccounts(
    params: DinoBrainParams,
    language: string,
    country: string,
    siteType: string,
    domain: string,
  ): ScoredAccount[] {
    const now = Date.now()
    const normalizedLanguage = normalizeAccountLanguage(language) || (language.toLowerCase() === 'en' ? 'en' : 'es')
    let accounts = loadRegistry()
      .filter(account => account.contentCredits > 0)
      .filter(account => !account.expiresAt || new Date(account.expiresAt).getTime() >= now)
      .filter(account => !account.cooldownUntil || new Date(account.cooldownUntil).getTime() <= now)

    if (normalizedLanguage === 'en') {
      accounts = accounts.filter(account => normalizeAccountLanguage(account.createdLanguage) === 'en')
    }

    return accounts
      .map(account => ({
        ...account,
        score: this.scoreAccount(account, normalizedLanguage, country, siteType, domain),
      }))
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score
        if (right.contentCredits !== left.contentCredits) return right.contentCredits - left.contentCredits
        const leftLastUsed = new Date(left.lastUsed || 0).getTime()
        const rightLastUsed = new Date(right.lastUsed || 0).getTime()
        return leftLastUsed - rightLastUsed
      })
  }

  private scoreAccount(
    account: AccountEntry,
    language: string,
    country: string,
    siteType: string,
    domain: string,
  ): number {
    let score = 0
    if (normalizeAccountLanguage(account.createdLanguage) === language) score += 10
    if ((account.createdCountry || '').toUpperCase() === country.toUpperCase()) score += 6
    if ((account.createdDomain || '').toLowerCase() === domain.toLowerCase() && domain) score += 4
    if ((account.createdProjectType || '').toLowerCase() === siteType.toLowerCase()) score += 3
    return score
  }

  private buildContext(
    params: DinoBrainParams,
    language: string,
    country: string,
    siteType: string,
    domain: string,
  ): string {
    const sections = [language === 'en' ? WRITING_INSTRUCTIONS_EN.trim() : WRITING_INSTRUCTIONS.trim()]
    if (params.context?.trim()) {
      sections.push(params.context.trim())
    }

    if (language === 'en') {
      sections.push('IMPORTANT: Write the entire article in English. Do not mix Spanish into headings, paragraphs, tables, labels, or examples.')
    } else {
      sections.push('IMPORTANTE: Redacta todo el contenido en español.')
    }

    sections.push(`Idioma objetivo: ${language}`)
    sections.push(`Pais objetivo: ${country}`)
    sections.push(`Tipo de sitio: ${siteType}`)
    if (domain) {
      sections.push(`Dominio objetivo: ${domain}`)
    }
    return sections.join('\n\n')
  }

  private async generateViaProFlow(
    api: DinoRankApiClient,
    keyword: string,
    language: 'en' | 'es',
    referer: string,
    context: string,
    exclusions: string,
    numWords: number,
  ): Promise<string> {
    const startRaw = await api.post(
      'https://dinorank.com/ajax/dinobrain/pro-start.php',
      new URLSearchParams({ keyword, imagenes: 'no' }).toString(),
      referer,
    )
    const startJson = this.parseProJson(startRaw, 'pro-start')
    const startHtml = this.getProHtml(startJson, 'pro-start')
    const selectedUrls = await this.parseDataListFromHtml(startHtml, '.dbpro-serp-check', 'data-url', 3)
    if (selectedUrls.length === 0) {
      throw new Error('pro-start did not return selectable SERP URLs')
    }

    const step1Body = new URLSearchParams()
    selectedUrls.forEach(url => step1Body.append('selected_urls', url))
    const step1Raw = await api.post('https://dinorank.com/ajax/dinobrain/pro-step1.php', step1Body.toString(), referer)
    const step1Json = this.parseProJson(step1Raw, 'pro-step1')
    const step1Html = this.getProHtml(step1Json, 'pro-step1')
    const selectedKeywords = await this.parseStep1Keywords(step1Html, keyword, 6)

    const step2Body = new URLSearchParams()
    selectedKeywords.forEach(kw => step2Body.append('selected_keywords', kw))
    const step2Raw = await api.post('https://dinorank.com/ajax/dinobrain/pro-step2.php', step2Body.toString(), referer)
    const step2Json = this.parseProJson(step2Raw, 'pro-step2')
    const step2Html = this.getProHtml(step2Json, 'pro-step2')
    const proFields = await this.parseProFieldsFromHtml(step2Html, keyword)

    // DinoRank can return a prefilled Spanish context in pro-step2.
    // For EN generation, override it to prevent Spanish output bleed-through.
    const contentBlocks = language === 'en'
      ? [
          context,
          'IMPORTANT: Keep the entire article in English only.',
          `Approximate target length: ${numWords} words`,
        ]
      : [
          proFields.context,
          context,
          `Longitud objetivo aproximada: ${numWords} palabras`,
        ]

    const contentWithHints = contentBlocks.filter(Boolean).join('\n\n')

    const generateRaw = await api.post(
      'https://dinorank.com/ajax/dinobrain/pro-generate.php',
      new URLSearchParams({
        h1: proFields.h1,
        content_type: proFields.contentType,
        context: contentWithHints,
        exclusions: proFields.exclusions || exclusions,
        structure: JSON.stringify(proFields.structure),
      }).toString(),
      referer,
    )

    const generateJson = this.parseProJson(generateRaw, 'pro-generate')
    const id = generateJson.id
    if (typeof id === 'number' || typeof id === 'string') {
      return String(id)
    }

    throw new Error('pro-generate did not return a generation id')
  }

  private parseProJson(raw: string, phase: string): Record<string, unknown> {
    const trimmed = raw.trim()
    if (!trimmed) {
      throw new Error(`${phase} returned empty response`)
    }

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(trimmed) as Record<string, unknown>
    } catch {
      throw new Error(`${phase} returned non-JSON response: ${trimmed.substring(0, 200)}`)
    }

    const status = typeof parsed.status === 'string' ? parsed.status : ''
    if (status !== 'ok') {
      const message = typeof parsed.message === 'string' ? parsed.message : status || 'unknown'
      throw new Error(`${phase} failed: ${message}`)
    }

    return parsed
  }

  private getProHtml(parsed: Record<string, unknown>, phase: string): string {
    const html = parsed.html
    if (typeof html === 'string' && html.trim()) {
      return html
    }
    throw new Error(`${phase} did not return html`) 
  }

  private async parseDataListFromHtml(html: string, selector: string, attr: string, limit: number): Promise<string[]> {
    const { JSDOM } = await import('jsdom')
    const dom = new JSDOM(html)
    return Array.from(dom.window.document.querySelectorAll(selector))
      .map(node => node.getAttribute(attr) || '')
      .map(value => value.trim())
      .filter(Boolean)
      .slice(0, limit)
  }

  private async parseStep1Keywords(html: string, fallbackKeyword: string, limit: number): Promise<string[]> {
    const { JSDOM } = await import('jsdom')
    const dom = new JSDOM(html)
    const document = dom.window.document

    const candidates = [
      ...Array.from(document.querySelectorAll('.dbpro-longtail-check[data-keyword]')).map(node => node.getAttribute('data-keyword') || ''),
      ...Array.from(document.querySelectorAll('[data-keyword]')).map(node => node.getAttribute('data-keyword') || ''),
      ...Array.from(document.querySelectorAll('input[name="selected_keywords"]')).map(node => (node as HTMLInputElement).value || ''),
      ...Array.from(document.querySelectorAll('input[type="checkbox"][value]')).map(node => (node as HTMLInputElement).value || ''),
    ]

    const seen = new Set<string>()
    const normalized = candidates
      .map(value => value.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .filter(value => {
        const key = value.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, limit)

    if (normalized.length > 0) {
      return normalized
    }

    // Fallback: keep flow alive when DinoRank step1 returns no selectable long-tail list.
    return [fallbackKeyword.trim()].filter(Boolean)
  }

  private async parseProFieldsFromHtml(
    html: string,
    fallbackKeyword: string,
  ): Promise<{ h1: string; contentType: string; context: string; exclusions: string; structure: ProStructureNode[] }> {
    const { JSDOM } = await import('jsdom')
    const dom = new JSDOM(html)
    const document = dom.window.document

    const h1 = document.querySelector('.dbpro-h1-label')?.textContent?.trim() || fallbackKeyword
    const contentType = (document.querySelector('#dinobrainProContentType') as HTMLSelectElement | null)?.value || 'blog'
    const context = (document.querySelector('#dinobrainProContext') as HTMLTextAreaElement | null)?.value || ''
    const exclusions = (document.querySelector('#dinobrainProExclusions') as HTMLTextAreaElement | null)?.value || ''

    const rows = Array.from(document.querySelectorAll('#dinobrainProOutlineTable tbody tr'))
    const structure: ProStructureNode[] = []
    let currentBlock: ProStructureNode | null = null

    for (const row of rows) {
      const type = row.getAttribute('data-outline-type') || ''
      const title = row.querySelector('.dbpro-outline-label')?.textContent?.trim() || ''
      if (!title) continue

      if (type === 'h2') {
        currentBlock = {
          title,
          enabled: (row.querySelector('.dbpro-outline-check') as HTMLInputElement | null)?.checked ?? true,
          length: (row.querySelector('.dbpro-length-select') as HTMLSelectElement | null)?.value || 'media',
          format_hint: row.getAttribute('data-format-hint') || '',
          children: [],
        }
        structure.push(currentBlock)
        continue
      }

      if (type === 'h3' && currentBlock) {
        currentBlock.children.push({
          title,
          enabled: (row.querySelector('.dbpro-outline-child-check') as HTMLInputElement | null)?.checked ?? true,
          format_hint: row.getAttribute('data-format-hint') || '',
        })
      }
    }

    if (structure.length === 0) {
      structure.push({
        title: `Guia completa sobre ${fallbackKeyword}`,
        enabled: true,
        length: 'media',
        format_hint: '',
        children: [
          { title: 'Conceptos clave', enabled: true, format_hint: '' },
          { title: 'Implementacion practica', enabled: true, format_hint: '' },
        ],
      })
    }

    return { h1, contentType, context, exclusions, structure }
  }

  private async pollForResult(
    api: DinoRankApiClient,
    idContenido: string,
    keyword: string,
    referer: string,
    pollingDelay: number,
  ): Promise<string> {
    const maxAttempts = 40

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const result = await api.post(
        'https://dinorank.com/ajax/controlIA.php',
        new URLSearchParams({
          t: String(Date.now()),
          idContenido,
        }).toString(),
        referer,
      )

      if (/finalizado|100%|"estado":"finalizado"/i.test(result)) {
        const finalHtml = await api.post(
          'https://dinorank.com/ajax/obtieneContenidoGenerado.php',
          new URLSearchParams({
            t: String(Date.now()),
            id: idContenido,
            modo: 'undefined',
            keyword,
          }).toString(),
          referer,
        )
        return finalHtml
      }

      if (attempt < maxAttempts - 1 && pollingDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, pollingDelay))
      }
    }

    throw new Error(`Timed out waiting for DinoBrain generation ${idContenido}`)
  }

  private async extractBodyContent(html: string): Promise<{ title: string; markdown: string }> {
    const { JSDOM } = await import('jsdom')
    const { default: TurndownService } = await import('turndown')

    const dom = new JSDOM(html)
    const document = dom.window.document
    const container = document.querySelector('#textodelcontenido') ?? document.body
    const workingNode = container.cloneNode(true) as HTMLElement
    const titleNode = workingNode.querySelector('h1')
    const title = titleNode?.textContent?.trim() || ''

    titleNode?.remove()
    workingNode.querySelectorAll('script, style, button, noscript').forEach(node => node.remove())

    const turndown = new TurndownService({
      headingStyle: 'atx',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
    })

    turndown.addRule('table', {
      filter: 'table',
      replacement: (_content, node) => this.tableElementToMarkdown(node as HTMLTableElement),
    })
    turndown.remove(['script', 'style', 'button', 'noscript'])

    const markdown = turndown.turndown(workingNode.innerHTML || workingNode.textContent || '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    return { title, markdown }
  }

  private tableElementToMarkdown(table: HTMLTableElement): string {
    const rows = Array.from(table.querySelectorAll('tr')).map((row) =>
      Array.from(row.querySelectorAll('th, td')).map((cell) =>
        (cell.textContent || '')
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/\|/g, '\\|'),
      ),
    )

    if (rows.length === 0) {
      return ''
    }

    const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0)
    const normalizedRows = rows.map((row) => {
      const cells = [...row]
      while (cells.length < columnCount) {
        cells.push('')
      }
      return cells
    })

    const [header, ...bodyRows] = normalizedRows
    const separator = Array(columnCount).fill('---')
    const lines = [`| ${header.join(' | ')} |`, `| ${separator.join(' | ')} |`]

    for (const row of bodyRows) {
      lines.push(`| ${row.join(' | ')} |`)
    }

    return `

${lines.join('\n')}

`
  }
}
