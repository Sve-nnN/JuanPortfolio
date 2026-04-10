import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContentFlywheelService } from '../../src/scripts/services/ContentFlywheelService';

// Mocks de servicios
const mockKeywordService = {
  research: vi.fn().mockResolvedValue([{ keyword: 'test', volume: 100, slug: 'test' }]),
};

const mockDinoBrainService = {
  generate: vi.fn().mockResolvedValue({ body: 'Content body', title: 'Content Title' }),
};

const mockPostService = {
  generateFrontmatter: vi.fn().mockResolvedValue('title: test'),
  assemble: vi.fn().mockReturnValue('---title: test--- content'),
  savePost: vi.fn().mockResolvedValue('path/to/post.md'),
};

const mockSyncService = {
  push: vi.fn().mockResolvedValue({ success: true }),
};

describe('ContentFlywheelService', () => {
  it('should execute the full content pipeline', async () => {
    const flywheel = new ContentFlywheelService(
      mockKeywordService as any,
      mockDinoBrainService as any,
      mockPostService as any,
      mockSyncService as any
    );

    const result = await flywheel.execute('test keyword', { provider: 'anthropic', country: 'es' });

    expect(mockKeywordService.research).toHaveBeenCalled();
    expect(mockDinoBrainService.generate).toHaveBeenCalled();
    expect(mockPostService.generateFrontmatter).toHaveBeenCalled();
    expect(mockSyncService.push).toHaveBeenCalled();
    expect(result.filePath).toBe('path/to/post.md');
  });
});