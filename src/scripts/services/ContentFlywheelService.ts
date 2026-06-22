import { KeywordService } from './KeywordService';
import { PostService } from './PostService';
import { LlmProvider } from '../create-post/llm-adapters';
import { ContentGenerator } from './ContentGenerator';
import { SyncService } from './SyncService';
import { linkService } from './LinkService';
import { dinoRankService } from './DinoRankService';
import { KWCacheEntry } from '../scrape-dinorank';
import { KeywordData } from '../syncKeywords';

export interface FlywheelResult {
  success: boolean;
  filePath?: string;
  keyword: string;
}

export class ContentFlywheelService {
  constructor(
    private keywordService: KeywordService,
    private contentGenerator: ContentGenerator,
    private postService: PostService,
    private syncService: SyncService
  ) {}

  /**
   * Executes the full automation pipeline for a given keyword.
   */
  async execute(keyword: string, options: { provider: LlmProvider, country: string }): Promise<FlywheelResult> {
    console.log(`[Flywheel] Starting automation for: ${keyword}`);

    // 1. Research
    const kwResults = await this.keywordService.research(keyword, { country: options.country });
    const primaryKw = kwResults[0];
    if (!primaryKw) throw new Error('Keyword research returned no results');

    // 1b. Keyword pivot — try AI suggestions; switch if >50% better score
    const finalKw = await this.maybePivotKeyword(primaryKw, options.country);
    if (finalKw.keyword !== primaryKw.keyword) {
      console.log(`[Flywheel] Pivoted keyword: "${primaryKw.keyword}" → "${finalKw.keyword}"`);
    }

    // 2. Generate Content Body
    const { body } = await this.contentGenerator.generate(finalKw.keyword, finalKw);

    // 3. Enrich with AI (Frontmatter)
    const frontmatter = await this.postService.generateFrontmatter(body, finalKw, options.provider);

    // 4. Assemble and Save
    const fullContent = this.postService.assemble(frontmatter, body);
    const slug = finalKw.keyword.toLowerCase().replace(/\s+/g, '-');
    const category = 'seo'; // Default category for now
    const filePath = await this.postService.savePost(category, slug, fullContent);

    // 5. Sync to CMS
    await this.syncService.push(filePath);

    // 6. Automatic Internal Linking
    console.log('[Flywheel] Running internal linking optimization...');
    await linkService.buildLinks({ locale: (primaryKw.language as any) || 'es' });

    return {
      success: true,
      filePath,
      keyword: finalKw.keyword
    };
  }

  private competitionWeight(competency: string): number {
    const c = competency.toLowerCase();
    if (c.includes('baja') || c === 'low') return 1;
    if (c.includes('alta') || c === 'high') return 3;
    return 2;
  }

  private kwScore(kw: KWCacheEntry | KeywordData): number {
    const vol = 'volume' in kw && typeof kw.volume === 'number'
      ? kw.volume
      : parseInt(String((kw as KWCacheEntry).volume ?? '0'), 10) || 0;
    const comp = 'competency' in kw
      ? String((kw as KWCacheEntry).competency)
      : String((kw as KeywordData).difficulty ?? 2);
    return vol / this.competitionWeight(comp);
  }

  private async maybePivotKeyword(primary: KeywordData, country: string): Promise<KeywordData> {
    try {
      const language = primary.language ?? 'es';
      const suggestions = await dinoRankService.getSuggestions(primary.keyword, country, language);
      if (suggestions.length === 0) return primary;

      const primaryScore = this.kwScore(primary);
      let best: KWCacheEntry | null = null;
      let bestScore = primaryScore;

      for (const s of suggestions) {
        const score = this.kwScore(s);
        if (score > bestScore) { best = s; bestScore = score; }
      }

      if (!best || bestScore <= primaryScore * 1.5) return primary;

      // Convert winning suggestion to KeywordData shape
      return {
        ...primary,
        keyword: best.keyword,
        volume: parseInt(best.volume, 10) || 0,
        difficulty: this.competitionWeight(best.competency) * 33,
        trend: Array.isArray(best.trend) ? best.trend.join(',') : '',
      };
    } catch {
      return primary;
    }
  }
}