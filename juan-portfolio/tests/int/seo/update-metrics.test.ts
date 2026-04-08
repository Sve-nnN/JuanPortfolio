import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Setup mocks BEFORE importing the module under test
vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({}),
  buildConfig: vi.fn().mockImplementation((config) => config),
}));

// Mock JSDOM
vi.mock('jsdom', () => ({
  JSDOM: class {
    window = {
      document: {
        querySelectorAll: () => [],
        querySelector: () => ({ textContent: 'Mock', getAttribute: () => 'Mock' }),
        body: { textContent: 'Mock content with nextjs and seo' }
      }
    }
  }
}));

global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  text: () => Promise.resolve('<html><body><h2>Competitor Heading</h2></body></html>'),
});

import { main } from '../../../src/scripts/update-seo-metrics';

describe('SEO Metrics Update Integration', () => {
  let tmpDir: string;
  let keywordsPath: string;
  const originalCwd = process.cwd();

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-integration-test-'));
    const contentDir = path.join(tmpDir, 'content');
    fs.mkdirSync(contentDir);
    keywordsPath = path.join(contentDir, 'keywords.md');
    
    // Exact header from our script
    const header = '| Keyword | Target URL | Volume | Difficulty | Intent | Status | Last Updated | Source | Related Searches | PAA Count | Top Domain | Has AI Overview | SERP Features | Competitor Headings | Competitor Meta | Avg. Word Count | Opportunity Score | Recommended Format | Cluster Type | Suggested Anchor Text | Funnel Stage | Information Gain |';
    const separator = '| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |';
    const row = '| nextjs seo optimization | /test | 0 | 0 | | | | | | 0 | | No | | | | 0 | 0 | | | | | |';

    const initialContent = `# Seed Keywords\n\n${header}\n${separator}\n${row}\n`;
    
    fs.writeFileSync(keywordsPath, initialContent);
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it('should update the keywords file with intelligence metadata', async () => {
    const originalArgv = [...process.argv];
    process.argv = ['node', 'script.js', '--source=mock', '--all'];

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    // Let's NOT mock stdout to see what's happening if it fails
    // vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await main();

    const updatedContent = fs.readFileSync(keywordsPath, 'utf-8');
    
    console.log('UPDATED CONTENT:', updatedContent);

    expect(updatedContent).toContain('Awareness (TOFU)');
    expect(updatedContent).toContain('script de automatización en Python');
    expect(updatedContent).toContain('Mock');
    
    process.argv = originalArgv;
    exitSpy.mockRestore();
  });
});
