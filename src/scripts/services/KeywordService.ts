import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { 
  updateKeywordInTable, 
  parseKeywordsMarkdown 
} from '../utils/markdownTable';
import { KeywordData, detectLang } from '../syncKeywords';
import { dinoRankService } from './DinoRankService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '../../..');
const KEYWORDS_FILE = join(ROOT, 'content/keywords.md');

export class KeywordService {
  /**
   * Performs keyword research using DinoRank and updates the local table.
   */
  async research(keyword: string, options: { country: string }): Promise<KeywordData[]> {
    const language = detectLang(keyword);
    const results = await dinoRankService.research([keyword], options.country, language);
    
    const kwDataList: KeywordData[] = results.map(res => ({
      keyword: res.keyword,
      volume: parseInt(res.volume, 10) || 0,
      difficulty: Math.round(parseFloat(String(res.competency).replace(',', '.')) * 100) || parseInt(String(res.competency), 10) || 0,
      country: res.country || options.country,
      language: language,
      source: 'DinoRank',
      lastUpdated: new Date().toISOString().split('T')[0],
      trend: Array.isArray(res.trend) ? res.trend.join(',') : '',
      relatedSearches: res.relatedSearches ? res.relatedSearches.split(',').map(s => s.trim()).filter(Boolean) : [],
      status: '-',
      targetURL: '',
      intent: '',
    }));

    for (const data of kwDataList) {
      await this.updateKeyword(data);
    }

    return kwDataList;
  }

  /**
   * Updates a keyword in the keywords.md file.
   */
  async updateKeyword(data: KeywordData): Promise<void> {
    if (!existsSync(KEYWORDS_FILE)) {
      throw new Error('keywords.md not found');
    }

    const content = readFileSync(KEYWORDS_FILE, 'utf-8');
    const updatedContent = updateKeywordInTable(content, data);
    writeFileSync(KEYWORDS_FILE, updatedContent);
  }

  /**
   * Gets all keywords from the keywords.md file.
   */
  async getAllKeywords(): Promise<KeywordData[]> {
    if (!existsSync(KEYWORDS_FILE)) return [];
    const content = readFileSync(KEYWORDS_FILE, 'utf-8');
    const { keywords } = parseKeywordsMarkdown(content);
    return keywords;
  }

  /**
   * Finds a keyword in the table.
   */
  async findKeyword(keyword: string): Promise<KeywordData | undefined> {
    const all = await this.getAllKeywords();
    return all.find(k => k.keyword.toLowerCase() === keyword.toLowerCase());
  }
}

export const keywordService = new KeywordService();