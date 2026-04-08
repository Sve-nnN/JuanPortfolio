import * as path from 'path';
import * as fs from 'fs';
import { KeywordExtractor } from '../internal-linking/KeywordExtractor';
import { ContentScanner } from '../internal-linking/ContentScanner';
import { LinkInjector } from '../internal-linking/LinkInjector';
import {
  buildClusterMap,
  getMissingClusterLinks
} from '../internal-linking/topicCluster';

export interface LinkServiceOptions {
  dryRun?: boolean;
  locale?: 'en' | 'es';
  verbose?: boolean;
}

export class LinkService {
  private contentDir: string;

  constructor() {
    this.contentDir = path.resolve(process.cwd(), 'content');
  }

  /**
   * Builds and applies internal links across all posts.
   */
  async buildLinks(options: LinkServiceOptions = {}): Promise<{ modified: number }> {
    console.log(`[LinkService] Building internal links (${options.locale || 'all locales'})...`);

    const extractor = new KeywordExtractor(this.contentDir);
    const allPosts = await extractor.loadPosts();
    let posts = allPosts;

    if (options.locale) {
      posts = posts.filter(p => (p.idioma ?? 'es') === options.locale);
    }

    const keywordIndex = extractor.buildIndex(posts);
    const injector = new LinkInjector();

    // 1. Structural Links (Topic Clusters)
    const clusterMap = buildClusterMap(posts);
    const missingClusterLinks = getMissingClusterLinks(clusterMap, (p) => {
      try { return fs.readFileSync(p, 'utf-8') } catch { return '' }
    });

    let modifiedCount = 0;
    if (missingClusterLinks.length > 0 && !options.dryRun) {
      modifiedCount += injector.applyClusterLinks(missingClusterLinks, false);
    }

    // 2. Keyword-based Links + semantic ranking (transformers multilingual by default)
    const scanner = new ContentScanner(keywordIndex, {
      maxLinksPerKeyword: 3,
      minWordLength: 3,
      excludePatterns: [/^```/, /^#{1,6}\s/, /^---$/, /^\s*[-*+]\s*$/],
      dryRun: !!options.dryRun,
      verbose: !!options.verbose,
      semantic: {
        enabled: true,
        provider: 'auto',
        model: 'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
      },
    });

    const opportunities = await scanner.scanAllPosts(posts);
    if (opportunities.size > 0 && !options.dryRun) {
      const result = injector.applyLinks(opportunities, false);
      modifiedCount += result.modifiedPosts.length;
    }

    return { modified: modifiedCount };
  }
}

export const linkService = new LinkService();
