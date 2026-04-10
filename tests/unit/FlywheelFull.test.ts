import { describe, it, expect, vi } from 'vitest';
import { ContentFlywheelService } from '../../src/scripts/services/ContentFlywheelService';

// Move mocks to top level
vi.mock('../../src/scripts/services/LinkService', () => ({
  linkService: { buildLinks: vi.fn().mockResolvedValue({ modified: 1 }) }
}));

vi.mock('../../src/scripts/services/DinoRankService', () => ({
  dinoRankService: { getSuggestions: vi.fn().mockResolvedValue([]) }
}));

describe('Flywheel Full Orchestration', () => {
  it('should flow correctly from research to linking', async () => {
    const mocks = {
      keyword: { research: vi.fn().mockResolvedValue([{ keyword: 'test', language: 'es' }]) },
      generator: { generate: vi.fn().mockResolvedValue({ body: 'Content' }) },
      post: { 
        generateFrontmatter: vi.fn().mockResolvedValue('title: test'),
        assemble: vi.fn().mockReturnValue('full'),
        savePost: vi.fn().mockResolvedValue('path/to/post.md')
      },
      sync: { push: vi.fn().mockResolvedValue({ success: true }) },
    };

    const flywheel = new ContentFlywheelService(
      mocks.keyword as any,
      mocks.generator as any,
      mocks.post as any,
      mocks.sync as any
    );

    const result = await flywheel.execute('test', { provider: 'openai', country: 'es' });

    expect(mocks.keyword.research).toHaveBeenCalledWith('test', expect.anything());
    expect(mocks.generator.generate).toHaveBeenCalledWith('test', expect.anything());
    expect(mocks.post.generateFrontmatter).toHaveBeenCalled();
    expect(mocks.sync.push).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });
});
