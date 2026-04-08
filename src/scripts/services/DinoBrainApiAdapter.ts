import { ContentGenerator, GeneratedContent } from './ContentGenerator';
import { DinoRankApiClient } from './DinoRankApiClient';
import { loadRegistry } from '../utils/accountRegistry';
import { KeywordData } from '../seo/keyword-utils';
import { WRITING_INSTRUCTIONS, CONTENT_EXCLUSIONS } from '../config/engine-prompts';

export class DinoBrainApiAdapter implements ContentGenerator {
  private pollingDelay: number = 20000;
  private verbose: boolean = false;

  constructor(options?: { pollingDelay?: number }) {
    if (options?.pollingDelay !== undefined) {
      this.pollingDelay = options.pollingDelay;
    }
  }

  setVerbose(val: boolean) { this.verbose = val; }

  async generate(keyword: string, data?: KeywordData): Promise<GeneratedContent> {
    const registry = loadRegistry();
    const accounts = registry.filter(a => a.contentCredits > 0);

    if (accounts.length === 0) {
      throw new Error('No hay cuentas con créditos de DinoBrain disponibles. El sistema debería haber creado una en la fase de investigación.');
    }

    let api: DinoRankApiClient | null = null;
    for (const account of accounts) {
      const candidate = new DinoRankApiClient(account.email, account.password);
      if (this.verbose) console.log(`[DinoBrainAPI] Logging in as ${account.email}...`);
      const loginStatus = await candidate.login();
      if (loginStatus === 'ok') {
        api = candidate;
        break;
      }
      console.warn(`[DinoBrainAPI] Login fallido para ${account.email} — saltando...`);
    }

    if (!api) throw new Error('Login fallido en todas las cuentas de DinoBrain disponibles.');

    // Fetch DinoBrain page to get fresh CSRF/Cookies and check credits
    if (this.verbose) console.log('[DinoBrainAPI] Initializing generation session...');
    const brainHtml = await api.get('https://dinorank.com/dinobrain/');
    const credits = api.extractContentCredits(brainHtml);
    
    if (this.verbose) console.log(`[DinoBrainAPI] Credits available: ${credits}`);
    if (credits <= 0) throw new Error('Sin créditos suficientes en DinoRank.');

    console.log(`[DinoBrainAPI] Iniciando generación para: ${keyword}...`);

    // Build Context from SERP Data
    let context = WRITING_INSTRUCTIONS;
    if (data) {
      context += `\n\nDATOS DEL SERP PARA OPTIMIZACIÓN:\n`;
      if (data.relatedSearches?.length) context += `- Búsquedas relacionadas: ${data.relatedSearches.join(', ')}\n`;
      if (data.paaQuestions?.length) context += `- Preguntas PAA (People Also Ask): ${data.paaQuestions.join(', ')}\n`;
      if (data.competitorHeadings) context += `- Estructura de competidores: ${data.competitorHeadings}\n`;
    }

    const numPalabras = data?.avgWordCount || 2000;
    const exclusions = CONTENT_EXCLUSIONS;

    const genBody = `t=${Date.now()}&keyword=${encodeURIComponent(keyword)}&imagenes=no&contexto=${encodeURIComponent(context)}&exclusiones=${encodeURIComponent(exclusions)}&numPalabras=${numPalabras}`;
    
    if (this.verbose) console.log('[DinoBrainAPI] Sending generation request...');
    const genRes = await api.post('https://dinorank.com/ajax/generaContenido.php', genBody, 'https://dinorank.com/dinobrain/');
    
    let idContenido: string;
    const trimmed = genRes.trim();
    if (/^\d+$/.test(trimmed)) {
      // New API: returns ID directly as a plain number
      idContenido = trimmed;
    } else {
      try {
        const genData = JSON.parse(trimmed);
        if (genData.status !== 'OK') throw new Error(`Error al iniciar generación: ${genRes}`);
        idContenido = genData.message;
      } catch (e) {
        console.error('[DinoBrainAPI] Error parsing start response:', genRes);
        throw e;
      }
    }

    console.log(`[DinoBrainAPI] Generando (ID: ${idContenido}, Palabras: ${numPalabras})...`);
    
    let finished = false;
    let attempts = 0;
    
    while (!finished && attempts < 40) {
      if (this.verbose) console.log(`[DinoBrainAPI] Wait ${this.pollingDelay / 1000}s... (Attempt ${attempts + 1})`);
      await new Promise(r => setTimeout(r, this.pollingDelay));
      attempts++;
      
      const pollBody = `t=${Date.now()}&idContenido=${idContenido}`;
      const pollRes = await api.post('https://dinorank.com/ajax/controlIA.php', pollBody, 'https://dinorank.com/dinobrain/');
      
      if (pollRes.includes('finalizado') || pollRes.includes('100%')) {
        finished = true;
        console.log('[DinoBrainAPI] Generation finished!');
      } else {
        if (this.verbose) console.log(`[DinoBrainAPI] Status: ${pollRes.slice(0, 100)}`);
      }
    }

    if (!finished) throw new Error('Timeout esperando la generación de contenido.');

    if (this.verbose) console.log('[DinoBrainAPI] Downloading content...');
    const finalBody = `t=${Date.now()}&id=${idContenido}&modo=undefined&keyword=`;
    const finalRes = await api.post('https://dinorank.com/ajax/obtieneContenidoGenerado.php', finalBody, 'https://dinorank.com/dinobrain/');

    const { title: extractedTitle, html: bodyHtml } = await this.extractBodyContent(finalRes);
    return {
      title: extractedTitle || `Post sobre ${keyword}`,
      body: bodyHtml,
      html: bodyHtml
    };
  }

  private async extractBodyContent(html: string): Promise<{ title: string; html: string }> {
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM(html);
    const container = dom.window.document.querySelector('#textodelcontenido');
    if (!container) return { title: '', html };
    const h1 = container.querySelector('h1');
    const title = h1?.textContent?.trim() ?? '';
    if (h1) h1.remove();
    return { title, html: container.innerHTML.trim() };
  }
}

export const dinoBrainApiAdapter = new DinoBrainApiAdapter();