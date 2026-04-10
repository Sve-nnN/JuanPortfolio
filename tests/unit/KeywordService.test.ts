import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KeywordService } from '../../src/scripts/services/KeywordService';
import * as fs from 'fs';

vi.mock('fs', () => {
  const mod = {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
  };
  return { ...mod, default: mod };
});

describe('KeywordService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error if keywords.md is missing', async () => {
    (fs.existsSync as any).mockReturnValue(false);
    const service = new KeywordService();
    await expect(service.getAllKeywords()).resolves.toEqual([]);
  });

  it('should find a keyword case-insensitively', async () => {
    const mockContent = '| Keyword | Volume |\n| --- | --- |\n| Test KW | 100 |';
    (fs.existsSync as any).mockReturnValue(true);
    (fs.readFileSync as any).mockReturnValue(mockContent);
    
    const service = new KeywordService();
    const result = await service.findKeyword('test kw');
    expect(result?.keyword).toBe('Test KW');
  });
});