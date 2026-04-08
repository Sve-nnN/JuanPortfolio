import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Setup mocks
vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({}),
  buildConfig: vi.fn().mockImplementation((config) => config),
}));

// Mock JSDOM to return a body with a clear long-tail keyword gap
vi.mock('jsdom', () => ({
  JSDOM: class {
    window = {
      document: {
        querySelectorAll: () => [],
        querySelector: () => ({ textContent: 'Mock', getAttribute: () => 'Mock' }),
        body: { textContent: 'This article covers technical seo guide for beginners and advanced nextjs optimization.' }
      }
    }
  }
}));

global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  text: () => Promise.resolve('<html><body><h2>Competitor Heading</h2></body></html>'),
});

import { main } from '../../../src/scripts/update-seo-metrics';

describe('Keyword Gap Analysis E2E', () => {
  let tmpDir: string;
  let keywordsPath: string;
  const originalCwd = process.cwd();

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gap-e2e-test-'));
    const contentDir = path.join(tmpDir, 'content');
    fs.mkdirSync(contentDir);
    keywordsPath = path.join(contentDir, 'keywords.md');
    
    const header = '| Keyword | Target URL | Volume | Difficulty | Intent | Status | Last Updated | Source | Related Searches | PAA Count | Top Domain | Has AI Overview | SERP Features | Competitor Headings | Competitor Meta | Avg. Word Count | Opportunity Score | Recommended Format | Cluster Type | Suggested Anchor Text | Funnel Stage | Information Gain |';
    const separator = '| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |';
    const row1 = '| keyword one | /test1 | 100 | 10 | Informational | | | | | 0 | | No | | | | 0 | 0 | | | | | |';
    const row2 = '| keyword two | /test2 | 100 | 10 | Informational | | | | | 0 | | No | | | | 0 | 0 | | | | | |';

    const initialContent = `# Seed Keywords\n\n${header}\n${separator}\n${row1}\n${row2}\n`;
    
    fs.writeFileSync(keywordsPath, initialContent);
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it('should discover gaps and append them to keywords.md', async () => {
    const originalArgv = [...process.argv];
    process.argv = ['node', 'script.js', '--source=mock', '--analyze-gap', '--all'];

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await main();

    const updatedContent = fs.readFileSync(keywordsPath, 'utf-8');
    
    expect(updatedContent).toContain('Gap');
    expect(updatedContent).toContain('GapAnalyzer');
    
    const lines = updatedContent.split('\n').filter(l => l.trim().startsWith('|'));
    // Header, separator, original, plus at least one gap
    expect(lines.length).toBeGreaterThan(3);
    
    process.argv = originalArgv;
    exitSpy.mockRestore();
  });
});
