import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DinoRankApiClient } from '../../src/scripts/services/DinoRankApiClient';

describe('DinoRank Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should retry on socket error', async () => {
    // Mocking a socket failure followed by success
    const socketError = new Error('fetch failed');
    (socketError as any).code = 'UND_ERR_SOCKET';

    (fetch as any)
      .mockRejectedValueOnce(socketError)
      .mockResolvedValueOnce({
        headers: new Headers(),
        text: () => Promise.resolve('success_after_retry'),
      });

    const api = new DinoRankApiClient('test@test.com', 'pass');
    
    // Mock delay to be instant during test
    (api as any).delay = vi.fn().mockResolvedValue(undefined);
    
    const result = await api.post('https://dinorank.com/test', '', 'ref', 1);
    
    expect(fetch).toHaveBeenCalledTimes(2); // One failure, one success
    expect(result).toBe('success_after_retry');
  });

  it('should apply random delays between requests', async () => {
    const api = new DinoRankApiClient('test@test.com', 'pass');
    
    // We will spy on the delay method
    const delaySpy = vi.spyOn(api as any, 'delay');
    
    (fetch as any).mockResolvedValue({
      headers: new Headers(),
      text: () => Promise.resolve('ok'),
    });

    await api.post('https://dinorank.com/test', '', 'ref');
    
    expect(delaySpy).toHaveBeenCalled();
  });
});