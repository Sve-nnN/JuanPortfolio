import { describe, it, expect, vi } from 'vitest';
import { DinoBrainApiAdapter } from '../../src/scripts/services/DinoBrainApiAdapter';
import { DinoRankApiClient } from '../../src/scripts/services/DinoRankApiClient';
import { KeywordData } from '../../src/scripts/seo/keyword-utils';
import * as registry from '../../src/scripts/utils/accountRegistry';

vi.mock('../../src/scripts/services/DinoRankApiClient');
vi.mock('../../src/scripts/utils/accountRegistry');

describe('SEO Context Injection', () => {
  it('should include PAA and Related Searches in the request context', async () => {
    (registry.loadRegistry as any).mockReturnValue([{ email: 'test@test.com', password: 'pass', contentCredits: 5 }]);
    
    const mockPost = vi.fn().mockResolvedValue(JSON.stringify({ status: 'OK', message: '123' }));
    (DinoRankApiClient as any).mockImplementation(class {
      login = vi.fn().mockResolvedValue('ok');
      get = vi.fn().mockResolvedValue('<html><div class="divlimites">Consumos restantes: 5</div></html>');
      post = mockPost;
      extractContentCredits = vi.fn().mockReturnValue(5);
    });

    const adapter = new DinoBrainApiAdapter({ pollingDelay: 0 });
    const mockData: KeywordData = {
      keyword: 'eeat',
      volume: 1000,
      difficulty: 20,
      intent: 'Informational',
      status: '-',
      targetURL: '',
      paaQuestions: ['Qué es EEAT?', 'Cómo mejorar EEAT?'],
      relatedSearches: ['eeat google guidelines'],
      avgWordCount: 2500
    };

    // Solo probamos el inicio del proceso
    await adapter.generate('eeat', mockData).catch(() => {});

    const genCall = mockPost.mock.calls.find(call => call[0].includes('generaContenido.php'));
    if (!genCall) {
      console.log('Available calls:', mockPost.mock.calls.map(c => c[0]));
      throw new Error('generaContenido.php call not found');
    }
    const payload = decodeURIComponent(genCall[1]);

    expect(payload).toContain('Qué es EEAT?');
    expect(payload).toContain('eeat google guidelines');
    expect(payload).toContain('numPalabras=2500');
  });
});