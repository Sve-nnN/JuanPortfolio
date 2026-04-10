import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DinoRankApiClient } from '../../src/scripts/services/DinoRankApiClient';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFileSync, readFileSync, rmSync, existsSync } from 'fs';

global.fetch = vi.fn();

function mockResponse(body: string, cookies: string[] = []) {
  return Promise.resolve({
    text: () => Promise.resolve(body),
    headers: { getSetCookie: () => cookies },
  });
}

// Shorthand fetch sequences for login (4 calls: GET /login/, POST login.php, GET /homed/, GET /keyword-research/)
function mockLogin(loginBody: string, loginCookies: string[] = []) {
  (global.fetch as ReturnType<typeof vi.fn>)
    .mockResolvedValueOnce({ text: () => Promise.resolve(''), headers: { getSetCookie: () => ['PHPSESSID=test123'] } })
    .mockResolvedValueOnce({ text: () => Promise.resolve(loginBody), headers: { getSetCookie: () => loginCookies } })
    .mockResolvedValueOnce({ text: () => Promise.resolve('<html>homed</html>'), headers: { getSetCookie: () => [] } })
    .mockResolvedValueOnce({ text: () => Promise.resolve('<html>keyword-research</html>'), headers: { getSetCookie: () => [] } });
}

describe('DinoRankApiClient', () => {
  let sessionFile: string;
  let client: DinoRankApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionFile = join(tmpdir(), `dinorank-session-test-${Date.now()}.json`);
    client = new DinoRankApiClient('test@test.com', 'pass123', sessionFile);
  });

  afterEach(() => {
    if (existsSync(sessionFile)) rmSync(sessionFile);
  });

  // ─── login() ──────────────────────────────────────────────────────────────

  describe('login()', () => {
    it('sends permanecer=no (not permanecer=si) in the request body', async () => {
      mockLogin('{"status":"activo"}');
      await client.login('es');

      const loginCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1];
      expect(loginCall[1].body).toContain('permanecer=no');
      expect(loginCall[1].body).not.toContain('permanecer=si');
    });

    it('returns ok on successful login', async () => {
      mockLogin('{"status":"activo"}');
      expect(await client.login('es')).toBe('ok');
    });

    it('returns device_conflict when response contains "dispositivo"', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ text: () => Promise.resolve(''), headers: { getSetCookie: () => [] } })
        .mockResolvedValueOnce({ text: () => Promise.resolve('{"message":"No se permite el acceso a la misma cuenta desde varios dispositivos a la vez"}'), headers: { getSetCookie: () => [] } });

      expect(await client.login('es')).toBe('device_conflict');
    });

    it('returns device_conflict when response contains "device"', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ text: () => Promise.resolve(''), headers: { getSetCookie: () => [] } })
        .mockResolvedValueOnce({ text: () => Promise.resolve('{"message":"device not allowed"}'), headers: { getSetCookie: () => [] } });

      expect(await client.login('es')).toBe('device_conflict');
    });

    it('returns failed on unknown login response', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ text: () => Promise.resolve(''), headers: { getSetCookie: () => [] } })
        .mockResolvedValueOnce({ text: () => Promise.resolve('{"status":"login-ko","message":"error"}'), headers: { getSetCookie: () => [] } });

      expect(await client.login('es')).toBe('failed');
    });

    it('navigates to /keyword-research/ after successful login', async () => {
      mockLogin('{"status":"activo"}');
      await client.login('es');

      const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const urls = calls.map((c: unknown[]) => c[0] as string);
      expect(urls.some(u => u.includes('/keyword-research/'))).toBe(true);
    });

    it('uses /en/login/ and /en/keyword-research/ when language is en', async () => {
      mockLogin('{"status":"activo"}');
      await client.login('en');

      const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const urls = calls.map((c: unknown[]) => c[0] as string);
      expect(urls[0]).toContain('/en/login/');
      expect(urls.some(u => u.includes('/en/keyword-research/'))).toBe(true);
    });
  });

  // ─── session persistence ───────────────────────────────────────────────────

  describe('session persistence', () => {
    it('saves cookies to session file after successful login', async () => {
      mockLogin('{"status":"activo"}', ['auth_token=xyz789']);
      await client.login('es');

      expect(existsSync(sessionFile)).toBe(true);
      const saved = JSON.parse(readFileSync(sessionFile, 'utf-8'));
      expect(saved['test@test.com']).toContain('PHPSESSID=test123');
    });

    it('creates session file if it does not exist', async () => {
      expect(existsSync(sessionFile)).toBe(false);
      mockLogin('{"status":"activo"}');
      await client.login('es');
      expect(existsSync(sessionFile)).toBe(true);
    });

    it('does not create session file on failed login', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ text: () => Promise.resolve(''), headers: { getSetCookie: () => [] } })
        .mockResolvedValueOnce({ text: () => Promise.resolve('{"status":"login-ko"}'), headers: { getSetCookie: () => [] } });

      await client.login('es');
      expect(existsSync(sessionFile)).toBe(false);
    });

    it('does not create session file on device_conflict', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ text: () => Promise.resolve(''), headers: { getSetCookie: () => [] } })
        .mockResolvedValueOnce({ text: () => Promise.resolve('{"message":"dispositivo"}'), headers: { getSetCookie: () => [] } });

      await client.login('es');
      expect(existsSync(sessionFile)).toBe(false);
    });

    it('preserves other accounts when saving', async () => {
      writeFileSync(sessionFile, JSON.stringify({ 'other@test.com': 'PHPSESSID=other' }));
      mockLogin('{"status":"activo"}');
      await client.login('es');

      const saved = JSON.parse(readFileSync(sessionFile, 'utf-8'));
      expect(saved['other@test.com']).toBe('PHPSESSID=other');
      expect(saved['test@test.com']).toBeDefined();
    });
  });

  // ─── logout() ─────────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('is a no-op when no cookies are set', async () => {
      await client.logout();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('calls cierra.php after successful login', async () => {
      mockLogin('{"status":"activo"}');
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ text: () => Promise.resolve('ok'), headers: { getSetCookie: () => [] } });

      await client.login('es');
      await client.logout();

      const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const logoutCall = calls.find((c: unknown[]) => typeof c[0] === 'string' && c[0].includes('cierra.php'));
      expect(logoutCall).toBeDefined();
    });

    it('sends cookie header in cierra.php call', async () => {
      mockLogin('{"status":"activo"}');
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ text: () => Promise.resolve('ok'), headers: { getSetCookie: () => [] } });

      await client.login('es');
      await client.logout();

      const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
      const logoutCall = calls.find((c: unknown[]) => typeof c[0] === 'string' && c[0].includes('cierra.php'));
      expect((logoutCall![1] as RequestInit).headers).toBeDefined();
      const headers = (logoutCall![1] as RequestInit).headers as Record<string, string>;
      expect(headers['Cookie']).toContain('PHPSESSID=test123');
    });

    it('clears cookies from session file', async () => {
      writeFileSync(sessionFile, JSON.stringify({ 'test@test.com': 'PHPSESSID=test123' }));
      mockLogin('{"status":"activo"}');
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ text: () => Promise.resolve('ok'), headers: { getSetCookie: () => [] } });

      await client.login('es');
      await client.logout();

      const saved = JSON.parse(readFileSync(sessionFile, 'utf-8'));
      expect(saved['test@test.com']).toBeUndefined();
    });

    it('preserves other accounts when clearing session', async () => {
      writeFileSync(sessionFile, JSON.stringify({
        'other@test.com': 'PHPSESSID=other',
        'test@test.com': 'PHPSESSID=test123',
      }));
      mockLogin('{"status":"activo"}');
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ text: () => Promise.resolve('ok'), headers: { getSetCookie: () => [] } });

      await client.login('es');
      await client.logout();

      const saved = JSON.parse(readFileSync(sessionFile, 'utf-8'));
      expect(saved['other@test.com']).toBe('PHPSESSID=other');
      expect(saved['test@test.com']).toBeUndefined();
    });

    it('clears in-memory cookies so subsequent logout is a no-op', async () => {
      mockLogin('{"status":"activo"}');
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ text: () => Promise.resolve('ok'), headers: { getSetCookie: () => [] } });

      await client.login('es');
      await client.logout();

      vi.clearAllMocks();
      await client.logout();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('completes gracefully when cierra.php throws', async () => {
      mockLogin('{"status":"activo"}');
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockRejectedValueOnce(new Error('network error'));

      await client.login('es');
      await expect(client.logout()).resolves.toBeUndefined();
    });
  });

  // ─── extractContentCredits() ──────────────────────────────────────────────

  describe('extractContentCredits()', () => {
    it('extracts numeric credit count from HTML', () => {
      expect(client.extractContentCredits('Consumos restantes: 42')).toBe(42);
    });

    it('is case-insensitive', () => {
      expect(client.extractContentCredits('CONSUMOS RESTANTES: 7')).toBe(7);
    });

    it('returns 0 when pattern is not found', () => {
      expect(client.extractContentCredits('<html>no credits here</html>')).toBe(0);
    });

    it('returns 0 on empty string', () => {
      expect(client.extractContentCredits('')).toBe(0);
    });
  });
});
