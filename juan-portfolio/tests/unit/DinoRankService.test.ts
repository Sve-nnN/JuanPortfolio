import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DinoRankService } from '../../src/scripts/services/DinoRankService';
import * as accountRegistry from '../../src/scripts/utils/accountRegistry';

vi.mock('../../src/scripts/utils/accountRegistry');
vi.mock('child_process', () => {
  const spawnSync = vi.fn(() => ({ status: 0 }));
  return {
    spawnSync,
    default: { spawnSync },
  };
});
vi.mock('fs', () => ({
  readFileSync: vi.fn(() => '{}'),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(() => true),
  default: {
    readFileSync: vi.fn(() => '{}'),
    writeFileSync: vi.fn(),
    existsSync: vi.fn(() => true),
  },
}));
global.fetch = vi.fn().mockImplementation(() => mockRes('ok'));

function mockRes(body: string, cookies: string[] = []) {
  return Promise.resolve({ text: () => Promise.resolve(body), headers: { getSetCookie: () => cookies } });
}

// Wraps HTML in the URL_PREFIX+JSON format that kresearch.php returns.
// Note: DinoRank API now always returns total_results=0 regardless of actual results.
function kresearchResponse(tableHtml: string): string {
  const escaped = tableHtml.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `https://visibilidad.dinorank.com/fake{"status":"OK","total_results":0,"message":"${escaped}"}`;
}

// New 10-column table row matching the current DinoRank layout:
// 0=checkbox, 1=keyword, 2=volume, 3=trend, 4=snippets, 5=intention, 6=CPC, 7=competition, 8=difficulty, 9=words
function tableRow(kw: string, vol: string, cpc: string, comp: string): string {
  return `<tr><td></td><td>${kw}</td><td>${vol}</td><td></td><td></td><td></td><td>${cpc}</td><td>${comp}</td><td></td><td></td></tr>`;
}

// Full login sequence: GET /login/, POST login.php, GET /homed/, GET /keyword-research/
function mockLoginOk() {
  (global.fetch as ReturnType<typeof vi.fn>)
    .mockResolvedValueOnce(mockRes('', ['PHPSESSID=abc']))
    .mockResolvedValueOnce(mockRes('{"status":"activo"}'))
    .mockResolvedValueOnce(mockRes('<html>homed</html>'))
    .mockResolvedValueOnce(mockRes('<html>kw-research</html>'));
}

const ACCOUNT = { email: 'test@test.com', password: 'pass123', kwCredits: 150, contentCredits: 5 };

describe('DinoRankService', () => {
  beforeEach(() => {
    vi.resetAllMocks(); // clears calls AND the mockResolvedValueOnce queue
    (accountRegistry.loadRegistry as ReturnType<typeof vi.fn>).mockReturnValue([ACCOUNT]);
    (accountRegistry.updateAccount as ReturnType<typeof vi.fn>).mockReturnValue(undefined);
  });

  it('is instantiable and has a research method', () => {
    const service = new DinoRankService();
    expect(service).toBeDefined();
    expect(typeof service.research).toBe('function');
  });

  // ─── parseTable: JSON wrapper extraction ────────────────────────────────────

  describe('parseTable (via research)', () => {
    it('extracts rows from JSON-wrapped kresearch.php response', async () => {
      mockLoginOk();
      const html = `<table><tbody>${tableRow('cursos seo', '1000', '2.50', '0.45')}</tbody></table>`;
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockRes(kresearchResponse(html)))
        .mockResolvedValueOnce(mockRes('ok')); // logout

      const service = new DinoRankService();
      const results = await service.research(['cursos seo'], 'es', 'es');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].keyword).toBe('cursos seo');
      expect(results[0].volume).toBe('1000');
      expect(results[0].cpc).toBe('2.50');
      expect(results[0].competency).toBe('0.45');
    });

    it('parses results immediately even when total_results=0 (new DinoRank API behavior)', async () => {
      mockLoginOk();
      const html = `<table><tbody>${tableRow('cursos seo', '1000', '2.50', '0.45')}</tbody></table>`;
      // total_results=0 is now the normal case — results are always in message HTML
      const response = `https://visibilidad.dinorank.com/fake{"status":"OK","total_results":0,"message":"${html.replace(/"/g, '\\"')}"}`;
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockRes(response))
        .mockResolvedValueOnce(mockRes('ok')); // logout

      const service = new DinoRankService();
      const results = await service.research(['cursos seo'], 'es', 'es');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].keyword).toBe('cursos seo');
    });

    it('retries when response has no JSON (server not ready)', async () => {
      mockLoginOk();
      const html = `<table><tbody>${tableRow('cursos seo', '1000', '2.50', '0.45')}</tbody></table>`;
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockRes('plain text'))           // attempt 1: no JSON
        .mockResolvedValueOnce(mockRes(kresearchResponse(html))) // attempt 2: results
        .mockResolvedValueOnce(mockRes('ok')); // logout

      const service = new DinoRankService();
      const results = await service.research(['cursos seo'], 'es', 'es');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].keyword).toBe('cursos seo');
    });

    it('returns empty array when all retries yield no JSON', async () => {
      mockLoginOk();
      // All 5 attempts return no-JSON
      for (let i = 0; i < 5; i++) {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockRes('plain text'));
      }
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockRes('ok')); // logout

      const service = new DinoRankService();
      await expect(service.research(['kw'], 'es', 'es')).rejects.toThrow('Se agotaron las cuentas disponibles');
    });
  });

  // ─── credits detection ───────────────────────────────────────────────────────

  describe('credits exhaustion detection', () => {
    it('marks account kwCredits=0 when response contains "créditos"', async () => {
      mockLoginOk();
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockRes('sin créditos disponibles'))
        .mockResolvedValueOnce(mockRes('ok'));

      const service = new DinoRankService();
      await expect(service.research(['kw'], 'es', 'es')).rejects.toThrow();
      expect(accountRegistry.updateAccount).toHaveBeenCalledWith('test@test.com', { kwCredits: 0 });
    });

    it('marks account kwCredits=0 when response contains "agotado"', async () => {
      mockLoginOk();
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockRes('crédito agotado'))
        .mockResolvedValueOnce(mockRes('ok'));

      const service = new DinoRankService();
      await expect(service.research(['kw'], 'es', 'es')).rejects.toThrow();
      expect(accountRegistry.updateAccount).toHaveBeenCalledWith('test@test.com', { kwCredits: 0 });
    });

    it('marks account kwCredits=0 when response contains "límites" (trial expired)', async () => {
      mockLoginOk();
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockRes('{"status":"ERROR","message":"Has alcanzado los límites del producto contratado"}'))
        .mockResolvedValueOnce(mockRes('ok'));

      const service = new DinoRankService();
      await expect(service.research(['kw'], 'es', 'es')).rejects.toThrow();
      expect(accountRegistry.updateAccount).toHaveBeenCalledWith('test@test.com', { kwCredits: 0 });
    });
  });

  // ─── login failure handling ──────────────────────────────────────────────────

  describe('login failure handling', () => {
    it('skips account on device_conflict and tries next', async () => {
      const account2 = { ...ACCOUNT, email: 'b@b.com', kwCredits: 100 };
      (accountRegistry.loadRegistry as ReturnType<typeof vi.fn>).mockReturnValue([ACCOUNT, account2]);

      // Account 1: device_conflict
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockRes('', []))
        .mockResolvedValueOnce(mockRes('{"message":"dispositivo bloqueado"}'));

      // Account 2: ok + results
      const html = `<table><tbody>${tableRow('seo', '5000', '1.0', '0.3')}</tbody></table>`;
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockRes('', ['PHPSESSID=b']))
        .mockResolvedValueOnce(mockRes('{"status":"activo"}'))
        .mockResolvedValueOnce(mockRes('<html>homed</html>'))
        .mockResolvedValueOnce(mockRes('<html>kw-research</html>'))
        .mockResolvedValueOnce(mockRes(kresearchResponse(html)))
        .mockResolvedValueOnce(mockRes('ok'));

      const service = new DinoRankService();
      const results = await service.research(['seo'], 'es', 'es');
      expect(results[0].keyword).toBe('seo');
    });

    it('skips account on failed login', async () => {
      const account2 = { ...ACCOUNT, email: 'b@b.com', kwCredits: 100 };
      (accountRegistry.loadRegistry as ReturnType<typeof vi.fn>).mockReturnValue([ACCOUNT, account2]);

      // Account 1: failed login
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockRes('', []))
        .mockResolvedValueOnce(mockRes('{"status":"login-ko"}'));

      // Account 2: ok + results
      const html = `<table><tbody>${tableRow('seo local', '200', '0.5', '0.2')}</tbody></table>`;
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockRes('', ['PHPSESSID=b']))
        .mockResolvedValueOnce(mockRes('{"status":"activo"}'))
        .mockResolvedValueOnce(mockRes('<html>homed</html>'))
        .mockResolvedValueOnce(mockRes('<html>kw-research</html>'))
        .mockResolvedValueOnce(mockRes(kresearchResponse(html)))
        .mockResolvedValueOnce(mockRes('ok'));

      const service = new DinoRankService();
      const results = await service.research(['seo local'], 'es', 'es');
      expect(results[0].keyword).toBe('seo local');
    });

    it('throws when all accounts are exhausted', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockRes('', []))
        .mockResolvedValueOnce(mockRes('{"status":"login-ko"}'));

      const service = new DinoRankService();
      await expect(service.research(['kw'], 'es', 'es')).rejects.toThrow('Se agotaron las cuentas disponibles');
    });

    it('throws when registry has no accounts with credits', async () => {
      (accountRegistry.loadRegistry as ReturnType<typeof vi.fn>).mockReturnValue([
        { ...ACCOUNT, kwCredits: 0 },
      ]);

      const service = new DinoRankService();
      // Will try to create new account but spawnSync is not mocked — just verify it throws
      await expect(service.research(['kw'], 'es', 'es')).rejects.toThrow();
    });
  });

  // ─── getSuggestions ──────────────────────────────────────────────────────────

  describe('getSuggestions()', () => {
    it('returns parsed suggestions from kresearchIAsimilares.php', async () => {
      mockLoginOk();
      const html = `<table><tbody>${tableRow('seo avanzado', '2000', '1.50', 'Baja')}${tableRow('seo tecnico', '800', '2.00', 'Media')}</tbody></table>`;
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockRes(kresearchResponse(html))) // kresearchIAsimilares
        .mockResolvedValueOnce(mockRes('ok')); // logout

      const service = new DinoRankService();
      const results = await service.getSuggestions('seo', 'es', 'es');

      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results[0].keyword).toBe('seo avanzado');
      expect(results[0].volume).toBe('2000');
      expect(results[0].competency).toBe('Baja');
    });

    it('returns [] when no accounts with credits exist', async () => {
      (accountRegistry.loadRegistry as ReturnType<typeof vi.fn>).mockReturnValue([
        { ...ACCOUNT, kwCredits: 0 },
      ]);

      const service = new DinoRankService();
      const results = await service.getSuggestions('seo');
      expect(results).toEqual([]);
    });

    it('returns [] when login fails', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockRes('', []))
        .mockResolvedValueOnce(mockRes('{"status":"login-ko"}'));

      const service = new DinoRankService();
      const results = await service.getSuggestions('seo');
      expect(results).toEqual([]);
    });

    it('returns [] when response has no JSON', async () => {
      mockLoginOk();
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockRes('plain text no json'))
        .mockResolvedValueOnce(mockRes('ok')); // logout

      const service = new DinoRankService();
      const results = await service.getSuggestions('seo');
      expect(results).toEqual([]);
    });

    it('returns [] on network error without throwing', async () => {
      mockLoginOk();
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockRejectedValueOnce(new Error('network error'));

      const service = new DinoRankService();
      await expect(service.getSuggestions('seo')).resolves.toEqual([]);
    });

    it('calls kresearchIAsimilares.php with correct body', async () => {
      mockLoginOk();
      const html = `<table><tbody>${tableRow('alt kw', '500', '1.0', 'Baja')}</tbody></table>`;
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockRes(kresearchResponse(html)))
        .mockResolvedValueOnce(mockRes('ok'));

      const service = new DinoRankService();
      await service.getSuggestions('cursos seo', 'mx', 'es');

      const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const suggestCall = calls.find((c: unknown[]) =>
        typeof c[0] === 'string' && c[0].includes('kresearchIAsimilares.php')
      );
      expect(suggestCall).toBeDefined();
      expect(suggestCall![1].body).toContain('keyword=cursos%20seo');
      expect(suggestCall![1].body).toContain('keyword_pais=MX');
    });
  });
});
