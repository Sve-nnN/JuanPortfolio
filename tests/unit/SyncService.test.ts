import { describe, it, expect, vi } from 'vitest';
import { SyncService } from '../../src/scripts/services/SyncService';
import { spawnSync } from 'child_process';

vi.mock('child_process', () => {
  const spawnSync = vi.fn();
  return {
    spawnSync,
    default: { spawnSync },
  };
});

describe('SyncService', () => {
  it('should call spawnSync with correct arguments', async () => {
    (spawnSync as any).mockReturnValue({ status: 0 });
    const service = new SyncService();
    const result = await service.push('test.md');
    
    expect(spawnSync).toHaveBeenCalledWith(
      'pnpm',
      expect.arrayContaining(['sync', 'push', '--', '--post=test.md']),
      expect.anything()
    );
    expect(result.success).toBe(true);
  });

  it('should throw error if spawnSync fails', async () => {
    (spawnSync as any).mockReturnValue({ status: 1 });
    const service = new SyncService();
    await expect(service.push('test.md')).rejects.toThrow('Sync push failed');
  });
});