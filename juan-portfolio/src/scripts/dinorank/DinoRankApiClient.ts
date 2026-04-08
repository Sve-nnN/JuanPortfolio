import { existsSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

export type DinoRankLoginResult = 'ok' | 'device_conflict' | 'failed'

const DEFAULT_SESSION_FILE = resolve(process.cwd(), 'content/dinorank-kw-session.json')
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'

type SessionMap = Record<string, string>

export class DinoRankApiClient {
  public email: string
  public pass: string
  private cookies = ''
  private sessionFile: string

  constructor(email: string, pass: string, sessionFile = DEFAULT_SESSION_FILE) {
    this.email = email
    this.pass = pass
    this.sessionFile = sessionFile
    this.restoreSession()
  }

  async login(language: string = 'es'): Promise<DinoRankLoginResult> {
    const isEn = language === 'en'
    const prefix = isEn ? 'en/' : ''
    const loginUrl = `https://dinorank.com/${prefix}login/`
    const homedUrl = `https://dinorank.com/${prefix}homed/`

    await this.get(loginUrl, loginUrl)

    const response = await this.post(
      'https://dinorank.com/ajax/login.php',
      new URLSearchParams({
        nombreUsuario: this.email,
        clave: this.pass,
        permanecer: 'si',
        elemento: '',
        tiempo: String(Date.now()),
      }).toString(),
      loginUrl,
    )

    const normalized = response.toLowerCase()
    if (normalized.includes('status":"activo')) {
      await this.get(homedUrl, loginUrl)
      const researchUrl = `https://dinorank.com/${prefix}keyword-research/`
      await this.get(researchUrl, homedUrl)
      this.persistSession()
      return 'ok'
    }

    if (normalized.includes('dispositivo') || normalized.includes('device') || normalized.includes('otro')) {
      return 'device_conflict'
    }

    return 'failed'
  }

  async get(url: string, referer?: string): Promise<string> {
    const response = await fetch(url, {
      method: 'GET',
      headers: this.buildHeaders(referer),
    })
    this.mergeCookiesFromResponse(response)
    return await response.text()
  }

  async post(url: string, body: string, referer: string, maxRetries = 3): Promise<string> {
    let attempt = 0

    while (true) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: this.buildHeaders(referer, {
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
          }),
          body,
        })
        this.mergeCookiesFromResponse(response)
        return await response.text()
      } catch (error) {
        attempt += 1
        if (!this.isRetryableError(error) || attempt >= maxRetries) {
          throw error
        }
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }
  }

  async logout(): Promise<void> {
    if (!this.cookies) {
      return
    }

    try {
      await this.post(
        'https://dinorank.com/ajax/cierra.php',
        `t=${Date.now()}`,
        'https://dinorank.com/',
      )
    } finally {
      this.removeSession()
      this.cookies = ''
    }
  }

  extractContentCredits(html: string): number {
    const patterns = [
      /DinoBRAIN[:\s]*(\d+)/i,
      /Content[:\s]*(\d+)/i,
      /Contenido[:\s]*(\d+)/i,
      /créditos?\s+de\s+contenido[:\s]*(\d+)/i,
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match?.[1]) {
        return Number.parseInt(match[1], 10)
      }
    }

    return 0
  }

  getCookieHeader(): string {
    return this.cookies
  }

  private buildHeaders(referer?: string, extra: Record<string, string> = {}): Headers {
    const headers = new Headers({
      accept: '*/*',
      'accept-language': 'en-US,en;q=0.9,es;q=0.8',
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      origin: 'https://dinorank.com',
      referer: referer ?? 'https://dinorank.com/',
      'sec-ch-ua': '"Chromium";v="145", "Not:A-Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent': UA,
      'x-requested-with': 'XMLHttpRequest',
      cookie: this.cookies,
      ...extra,
    })

    if (referer) {
      headers.set('referer', referer)
    }

    return headers
  }

  private getSetCookies(response: Response): string[] {
    const headers = response.headers as Headers & { getSetCookie?: () => string[] }
    if (typeof headers.getSetCookie === 'function') {
      return headers.getSetCookie().filter(Boolean)
    }

    const raw = response.headers.get('set-cookie')
    if (!raw) {
      return []
    }

    return raw.split(/,(?=\s*[^;,=]+=[^;,]+)/g).map(cookie => cookie.trim()).filter(Boolean)
  }

  private mergeCookies(rawCookies: string[]): void {
    const cookieMap = new Map<string, string>()

    if (this.cookies) {
      for (const cookie of this.cookies.split(/;\s*/)) {
        if (!cookie) continue
        const index = cookie.indexOf('=')
        if (index === -1) continue
        cookieMap.set(cookie.slice(0, index), cookie.slice(index + 1))
      }
    }

    for (const rawCookie of rawCookies) {
      const firstPart = rawCookie.split(';')[0]?.trim()
      if (!firstPart) continue
      const index = firstPart.indexOf('=')
      if (index === -1) continue
      cookieMap.set(firstPart.slice(0, index), firstPart.slice(index + 1))
    }

    this.cookies = Array.from(cookieMap.entries()).map(([name, value]) => `${name}=${value}`).join('; ')
  }

  private mergeCookiesFromResponse(response: Response): void {
    this.mergeCookies(this.getSetCookies(response))
  }

  private restoreSession(): void {
    if (!existsSync(this.sessionFile)) {
      return
    }

    try {
      const sessions = this.readSessions()
      this.cookies = typeof sessions[this.email] === 'string' ? sessions[this.email] : ''
    } catch {
      this.cookies = ''
    }
  }

  private persistSession(): void {
    if (!this.cookies) {
      return
    }

    const sessions = this.readSessions()
    sessions[this.email] = this.cookies
    this.writeSessions(sessions)
  }

  private removeSession(): void {
    if (!existsSync(this.sessionFile)) {
      return
    }

    const sessions = this.readSessions()
    if (this.email in sessions) {
      delete sessions[this.email]
      this.writeSessions(sessions)
    }
  }

  private readSessions(): SessionMap {
    if (!existsSync(this.sessionFile)) {
      return {}
    }

    try {
      const raw = readFileSync(this.sessionFile, 'utf-8')
      const parsed = JSON.parse(raw) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as SessionMap
      }
    } catch {
      return {}
    }

    return {}
  }

  private writeSessions(sessions: SessionMap): void {
    writeFileSync(this.sessionFile, JSON.stringify(sessions, null, 2))
  }

  private isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false
    }

    const code = (error as Error & { code?: string }).code
    return Boolean(
      code && ['ECONNRESET', 'EPIPE', 'ETIMEDOUT', 'ECONNREFUSED', 'UND_ERR_SOCKET'].includes(code),
    ) || /socket|network/i.test(error.message)
  }
}
