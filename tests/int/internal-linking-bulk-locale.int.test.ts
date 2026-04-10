import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { KeywordExtractor } from '../../src/scripts/internal-linking/KeywordExtractor';
import { ContentScanner } from '../../src/scripts/internal-linking/ContentScanner';
import type { LinkingConfig } from '../../src/scripts/internal-linking/types';

const TEST_DIR = path.resolve(process.cwd(), 'tmp-test-bulk-locale-isolation');

// Helper to create mock files
const createMockFile = async (filePath: string, content: string) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
};

describe('Internal Linking - Bulk Apply Locale Isolation', () => {
  const config: LinkingConfig = {
    dryRun: true,
    verbose: false,
    maxLinksPerKeyword: 3,
    minWordLength: 3,
    excludePatterns: [],
    semantic: { enabled: false },
  };

  beforeAll(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  it('should not link ES source to EN target (cross-locale rejection)', async () => {
    const testSubDir = path.join(TEST_DIR, 'es-to-en');

    // EN target: slug=algorithms, idioma: en
    const enTarget = `---
title: Algorithms Guide
idioma: en
primary_keywords: [big-o notation]
semantic_keywords: []
category: cs
---
This guide covers big-o notation in English.
`;
    await createMockFile(path.join(testSubDir, 'posts', 'cs', 'algorithms.en.md'), enTarget);

    // ES source: mentions "big-o notation" in body, idioma: es
    const esSource = `---
title: Guía de Notación Big O
idioma: es
primary_keywords: [guia big o]
semantic_keywords: []
category: cs
---
La notación big-o notation es fundamental en algoritmia.
`;
    await createMockFile(path.join(testSubDir, 'posts', 'cs', 'big-o.md'), esSource);

    const extractor = new KeywordExtractor(testSubDir);
    const allPosts = await extractor.loadPosts();
    const index = extractor.buildIndex(allPosts);
    const scanner = new ContentScanner(index, config);

    const esPost = allPosts.find(p => p.slug === 'big-o');
    expect(esPost).toBeDefined();

    const opportunities = scanner.scanPost(esPost!, allPosts);
    expect(opportunities).toHaveLength(0);
  });

  it('should link ES source to ES target (same-locale accepted)', async () => {
    const testSubDir = path.join(TEST_DIR, 'es-to-es');

    // ES target: slug=algorithms, idioma: es
    const esTarget = `---
title: Guía de Algoritmos
idioma: es
primary_keywords: [big-o notation]
semantic_keywords: []
category: cs
---
Esta guía cubre big-o notation en español.
`;
    await createMockFile(path.join(testSubDir, 'posts', 'cs', 'algorithms.md'), esTarget);

    // ES source: mentions "big-o notation" in body, idioma: es
    const esSource = `---
title: Notación Big O
idioma: es
primary_keywords: [notacion big o]
semantic_keywords: []
category: cs
---
La notación big-o notation es fundamental en algoritmia moderna.
`;
    await createMockFile(path.join(testSubDir, 'posts', 'cs', 'big-o.md'), esSource);

    const extractor = new KeywordExtractor(testSubDir);
    const allPosts = await extractor.loadPosts();
    const index = extractor.buildIndex(allPosts);
    const scanner = new ContentScanner(index, config);

    const esPost = allPosts.find(p => p.slug === 'big-o');
    expect(esPost).toBeDefined();

    const opportunities = scanner.scanPost(esPost!, allPosts);
    expect(opportunities.length).toBeGreaterThanOrEqual(1);
  });

  it('should not link EN source to ES target (cross-locale rejection)', async () => {
    const testSubDir = path.join(TEST_DIR, 'en-to-es');

    // ES target: slug=algorithms, idioma: es
    const esTarget = `---
title: Guía de Algoritmos
idioma: es
primary_keywords: [big-o notation]
semantic_keywords: []
category: cs
---
Esta guía cubre big-o notation en español.
`;
    await createMockFile(path.join(testSubDir, 'posts', 'cs', 'algorithms.md'), esTarget);

    // EN source: mentions "big-o notation" in body, idioma: en
    const enSource = `---
title: Big O Notation Guide
idioma: en
primary_keywords: [en big o guide]
semantic_keywords: []
category: cs
---
Understanding big-o notation is essential for every developer.
`;
    await createMockFile(path.join(testSubDir, 'posts', 'cs', 'big-o-guide.en.md'), enSource);

    const extractor = new KeywordExtractor(testSubDir);
    const allPosts = await extractor.loadPosts();
    const index = extractor.buildIndex(allPosts);
    const scanner = new ContentScanner(index, config);

    const enPost = allPosts.find(p => p.slug === 'big-o-guide');
    expect(enPost).toBeDefined();

    const opportunities = scanner.scanPost(enPost!, allPosts);
    expect(opportunities).toHaveLength(0);
  });

  it('should link EN source to EN target (same-locale accepted)', async () => {
    const testSubDir = path.join(TEST_DIR, 'en-to-en');

    // EN target: slug=algorithms-en, idioma: en
    const enTarget = `---
title: Algorithms in Depth
idioma: en
primary_keywords: [big-o notation]
semantic_keywords: []
category: cs
---
An in-depth guide to big-o notation for English readers.
`;
    await createMockFile(path.join(testSubDir, 'posts', 'cs', 'algorithms.en.md'), enTarget);

    // EN source: mentions "big-o notation" in body, idioma: en
    const enSource = `---
title: Introduction to Algorithms
idioma: en
primary_keywords: [introduction algorithms]
semantic_keywords: []
category: cs
---
Every programmer should understand big-o notation and how it applies to real code.
`;
    await createMockFile(path.join(testSubDir, 'posts', 'cs', 'intro-algorithms.en.md'), enSource);

    const extractor = new KeywordExtractor(testSubDir);
    const allPosts = await extractor.loadPosts();
    const index = extractor.buildIndex(allPosts);
    const scanner = new ContentScanner(index, config);

    const enPost = allPosts.find(p => p.slug === 'intro-algorithms');
    expect(enPost).toBeDefined();

    const opportunities = scanner.scanPost(enPost!, allPosts);
    expect(opportunities.length).toBeGreaterThanOrEqual(1);
  });
});
