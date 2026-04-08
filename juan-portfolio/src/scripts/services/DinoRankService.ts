import { loadRegistry, updateAccount, deleteAccount } from '../utils/accountRegistry';
import { KWCacheEntry } from '../scrape-dinorank';
import { DinoRankApiClient } from './DinoRankApiClient';
import { spawnSync } from 'child_process';
import path from 'path';
import { JSDOM } from 'jsdom';

export class DinoRankService {
  private verbose: boolean = false;
  private static accountsCreatedThisSession: number = 0;
  private readonly MAX_CREATIONS_PER_SESSION = 1;

  setVerbose(val: boolean) { this.verbose = val; }

  async research(keywords: string[], country: string = 'es', language: string = 'es'): Promise<KWCacheEntry[]> {
    const excluded = new Set<string>();
    
    // Intentamos con las cuentas disponibles
    const registry = loadRegistry();
    const available = registry.filter(a => a.kwCredits > 0).sort((a, b) => b.kwCredits - a.kwCredits);
    
    if (this.verbose) console.log(`[DinoRankService] Cuentas con créditos en registro: ${available.length}`);

    for (const account of available) {
      if (excluded.has(account.email)) continue;
      
      const api = new DinoRankApiClient(account.email, account.password);
      try {
        const loginStatus = await api.login(language);

        if (loginStatus === 'device_conflict') {
          console.warn(`[DinoRankService] Device conflict en ${account.email}. Saltando a siguiente cuenta...`);
          excluded.add(account.email);
          continue;
        }

        if (loginStatus === 'failed') {
          console.warn(`[DinoRankService] Login fallido para ${account.email}. Saltando cuenta...`);
          excluded.add(account.email);
          continue;
        }

        const results: KWCacheEntry[] = [];
        let creditsExhausted = false;
        for (const kw of keywords) {
          const kwResults = await this.searchWithPolling(api, kw, country, language, account.email);
          if (kwResults === null) { creditsExhausted = true; break; }
          results.push(...kwResults);
        }
        if (creditsExhausted) continue;

        await api.logout();
        if (results.length > 0) return results;

      } catch (error: any) {
        await api.logout();
        excluded.add(account.email);
      }
    }

    // SOLO creamos cuenta si NO HAY NINGUNA con créditos en el registro
    if (available.length === 0) {
      return await this.createNewAccountAndRetry(keywords, country, language);
    }

    throw new Error('Se agotaron las cuentas disponibles o hay bloqueos de red.');
  }

  private async createNewAccountAndRetry(keywords: string[], country: string, language: string): Promise<KWCacheEntry[]> {
    if (DinoRankService.accountsCreatedThisSession >= this.MAX_CREATIONS_PER_SESSION) {
      throw new Error('Límite de creación de cuentas alcanzado.');
    }

    console.log('[DinoRankService] Creando cuenta nueva (Registro vacío)...');
    DinoRankService.accountsCreatedThisSession++;
    
    const ROOT = path.resolve(process.cwd());
    spawnSync('pnpm', ['tsx', 'src/scripts/scrape-dinorank.ts', '--onboarding'], { cwd: ROOT, stdio: 'inherit', shell: true });

    return this.research(keywords, country, language);
  }

  /** Returns rows, [] if no results, or null if credits are exhausted. */
  /**
   * Fetches AI-suggested alternative keywords for a given keyword.
   * Returns [] on any failure (non-critical path).
   */
  async getSuggestions(keyword: string, country: string = 'es', language: string = 'es'): Promise<KWCacheEntry[]> {
    const registry = loadRegistry();
    const available = registry.filter(a => a.kwCredits > 0).sort((a, b) => b.kwCredits - a.kwCredits);
    if (available.length === 0) return [];

    const account = available[0];
    const api = new DinoRankApiClient(account.email, account.password);
    try {
      const loginStatus = await api.login(language);
      if (loginStatus !== 'ok') return [];

      const body = `keyword=${encodeURIComponent(keyword)}&keyword_pais=${country.toUpperCase()}&keyword_idioma=${language}`;
      const referer = `https://dinorank.com/${language === 'en' ? 'en/' : ''}keyword-research/`;
      const raw = await api.post('https://dinorank.com/ajax/kresearchIAsimilares.php', body, referer);

      const jsonStart = raw.indexOf('{');
      if (jsonStart === -1) return [];

      const json = JSON.parse(raw.slice(jsonStart));
      if (json.status === 'OK' && json.message) {
        return await this.parseTable(json.message, country);
      }
      return [];
    } catch {
      return [];
    } finally {
      await api.logout();
    }
  }

  /** Returns rows, [] if no results, or null if credits are exhausted. */
  private async searchWithPolling(
    api: DinoRankApiClient,
    kw: string,
    country: string,
    language: string,
    email: string,
  ): Promise<KWCacheEntry[] | null> {
    const bodySearch = `keyword=${encodeURIComponent(kw)}&analisis_id=&keyword_pais=${country.toUpperCase()}&keyword_idioma=${language}&grupokeywordbuscar=&grupokeywordocultar=&desdeotrakeyword=&orden=&filtro=&volumendesdekr=&volumenhastakr=&incluirkrinput=&excluirkrinput=&cpcdesdekr=&cpchastakr=`;
    const referer = `https://dinorank.com/${language === 'en' ? 'en/' : ''}keyword-research/`;

    for (let attempt = 0; attempt < 5; attempt++) {
      const raw = await api.post('https://dinorank.com/ajax/kresearch.php', bodySearch, referer);

      if (raw.includes('créditos') || raw.includes('agotado') || raw.includes('límites')) {
        updateAccount(email, { kwCredits: 0 });
        return null;
      }

      const jsonStart = raw.indexOf('{');
      if (jsonStart === -1) {
        // No JSON yet — server may still be processing, wait and retry
        if (attempt < 4) await new Promise(r => setTimeout(r, 3000));
        continue;
      }

      try {
        const json = JSON.parse(raw.slice(jsonStart));
        if (json.status === 'OK' && json.message) {
          // total_results is no longer reliable (DinoRank API always returns 0).
          // Parse the HTML table directly from message.
          return await this.parseTable(json.message, country);
        }
      } catch {
        if (attempt < 4) await new Promise(r => setTimeout(r, 3000));
      }
    }

    return [];
  }

  private async parseTable(html: string, country: string): Promise<KWCacheEntry[]> {
    const dom = new JSDOM(html);
    const results: KWCacheEntry[] = [];
    dom.window.document.querySelectorAll('tr').forEach((row: any) => {
      const cells: any[] = Array.from(row.querySelectorAll('td'));
      // New DinoRank table layout (10 cols): 0=checkbox, 1=keyword, 2=volume,
      // 3=trend, 4=snippets, 5=intention, 6=CPC, 7=competition, 8=difficulty, 9=words
      if (cells.length < 8) return;
      const kw = cells[1]!.textContent?.split('\n').map((s: string) => s.trim()).find((s: string) => s.length > 1) ?? '';
      const vol = cells[2]!.textContent?.replace(/\D/g, '') ?? '0';
      const cpc = cells[6]!.textContent?.replace(/[^\d,.]/g, '').replace(',', '.') ?? '0';
      const comp = cells[7]!.textContent?.trim() ?? '';
      if (kw && kw.length > 1) {
        results.push({ keyword: kw, volume: vol, cpc, competency: comp, country, trend: [], relatedSearches: '', timestamp: new Date().toISOString() });
      }
    });
    return results;
  }
}

export const dinoRankService = new DinoRankService();