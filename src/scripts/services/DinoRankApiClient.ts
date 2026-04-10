import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DEFAULT_SESSION_FILE = resolve(__dirname, '../../../content/dinorank-kw-session.json');

export const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36';

export class DinoRankApiClient {
  private cookies: string = '';
  private readonly sessionFile: string;

  constructor(public email: string, public pass: string, sessionFile?: string) {
    this.sessionFile = sessionFile ?? DEFAULT_SESSION_FILE;
  }

  private getSetCookies(response: Response): string[] {
    const h = response.headers as unknown as { getSetCookie?: () => string[] };
    if (typeof h.getSetCookie === 'function') return h.getSetCookie();
    const raw = response.headers.get('set-cookie');
    return raw ? [raw] : [];
  }

  private mergeCookies(raw: string[]): void {
    const map = new Map<string, string>();
    if (this.cookies) {
      this.cookies.split(';').forEach(c => {
        const idx = c.indexOf('=');
        if (idx > 0) map.set(c.slice(0, idx).trim(), c.slice(idx + 1).trim());
      });
    }
    for (const cookie of raw) {
      const kv = cookie.split(';')[0]?.trim();
      if (!kv) continue;
      const idx = kv.indexOf('=');
      if (idx > 0) map.set(kv.slice(0, idx).trim(), kv.slice(idx + 1).trim());
    }
    this.cookies = Array.from(map.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
  }

  private commonHeaders(referer: string): Record<string, string> {
    return {
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Origin': 'https://dinorank.com',
      'Referer': referer,
      'User-Agent': UA,
      'X-Requested-With': 'XMLHttpRequest',
      'Cookie': this.cookies,
    };
  }

  private savePersistedCookies(): void {
    try {
      let data: Record<string, string> = {};
      if (existsSync(this.sessionFile)) {
        data = JSON.parse(readFileSync(this.sessionFile, 'utf-8'));
      }
      data[this.email] = this.cookies;
      writeFileSync(this.sessionFile, JSON.stringify(data, null, 2));
    } catch {
      // Best-effort — ignore write errors
    }
  }

  private clearPersistedCookies(): void {
    try {
      if (!existsSync(this.sessionFile)) return;
      const data = JSON.parse(readFileSync(this.sessionFile, 'utf-8'));
      delete data[this.email];
      writeFileSync(this.sessionFile, JSON.stringify(data, null, 2));
    } catch {
      // Best-effort — ignore errors
    }
  }

  private async delay(ms: number = 0): Promise<void> {
    await new Promise(r => setTimeout(r, ms));
  }

  async post(url: string, body: string, referer: string, maxRetries: number = 3): Promise<string> {
    await this.delay();
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: this.commonHeaders(referer),
          body,
        });
        this.mergeCookies(this.getSetCookies(res));
        return res.text();
      } catch (err: unknown) {
        const code = (err as any)?.code;
        const isSocket = code === 'UND_ERR_SOCKET' || (err as Error)?.message?.includes('fetch failed');
        if (isSocket && attempt < maxRetries) {
          await this.delay(1000);
          continue;
        }
        throw err;
      }
    }
    throw new Error('Max retries exceeded');
  }

  async get(url: string, referer: string = url): Promise<string> {
    const res = await fetch(url, {
      headers: { ...this.commonHeaders(referer), 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8' },
    });
    this.mergeCookies(this.getSetCookies(res));
    return res.text();
  }

  async logout(): Promise<void> {
    if (!this.cookies) return;
    try {
      await this.post('https://dinorank.com/ajax/cierra.php', `t=${Date.now()}`, 'https://dinorank.com/homed/');
    } catch {
      // Best-effort logout — ignore errors
    }
    this.clearPersistedCookies();
    this.cookies = '';
  }

  async login(language: string = 'es'): Promise<'ok' | 'device_conflict' | 'failed'> {
    const isEn = language === 'en';
    const loginUrl = `https://dinorank.com/${isEn ? 'en/' : ''}login/`;

    // 1. Initial hit to get PHPSESSID
    const initRes = await fetch(loginUrl, { headers: { 'User-Agent': UA } });
    this.mergeCookies(this.getSetCookies(initRes));

    // 2. Login POST — permanecer=no keeps sessions short-lived (~20-30 min idle)
    const body = `nombreUsuario=${encodeURIComponent(this.email)}&clave=${encodeURIComponent(this.pass)}&permanecer=no&elemento=&tiempo=${Date.now()}`;
    const html = await this.post('https://dinorank.com/ajax/login.php', body, loginUrl);

    if (html.includes('status":"activo"')) {
      const homedUrl = `https://dinorank.com/${isEn ? 'en/' : ''}homed/`;
      await this.get(homedUrl, loginUrl);
      // Initialize keyword-research session (required before kresearch.php calls)
      const researchUrl = `https://dinorank.com/${isEn ? 'en/' : ''}keyword-research/`;
      await this.get(researchUrl, homedUrl);
      this.savePersistedCookies();
      return 'ok';
    }

    if (html.includes('dispositivo') || html.includes('device')) return 'device_conflict';
    return 'failed';
  }

  extractContentCredits(html: string): number {
    const match = html.match(/Consumos restantes:\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : 0;
  }
}
