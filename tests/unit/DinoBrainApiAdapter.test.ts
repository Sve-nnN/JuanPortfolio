import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DinoBrainApiAdapter } from '../../src/scripts/services/DinoBrainApiAdapter';
import { DinoRankApiClient } from '../../src/scripts/services/DinoRankApiClient';
import * as registry from '../../src/scripts/utils/accountRegistry';

vi.mock('../../src/scripts/services/DinoRankApiClient');
vi.mock('../../src/scripts/utils/accountRegistry');

const ACCOUNT = { email: 'test@test.com', password: 'pass', contentCredits: 5 };

function mockApi(postResponses: string[]) {
  const mockPost = vi.fn();
  const mockGet = vi.fn().mockResolvedValue('Consumos restantes: 10');
  postResponses.forEach(r => mockPost.mockResolvedValueOnce(r));
  (DinoRankApiClient as any).mockImplementation(class {
    login = vi.fn().mockResolvedValue('ok');
    post = mockPost;
    get = mockGet;
    extractContentCredits = vi.fn().mockReturnValue(10);
  });
  return { mockPost, mockGet };
}

describe('DinoBrainApiAdapter', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (registry.loadRegistry as any).mockReturnValue([ACCOUNT]);
  });

  it('throws when no accounts with credits are available', async () => {
    (registry.loadRegistry as any).mockReturnValue([
      { email: 'empty@test.com', password: 'pass', contentCredits: 0 }
    ]);
    const adapter = new DinoBrainApiAdapter();
    await expect(adapter.generate('test')).rejects.toThrow('No hay cuentas con créditos');
  });

  it('accepts plain numeric ID from generaContenido.php', async () => {
    const html = '<div id="textodelcontenido"><h1>Título</h1><p>Cuerpo del artículo</p></div>';
    mockApi([
      '304927',       // generaContenido — plain number
      'finalizado',   // controlIA
      html,           // obtieneContenidoGenerado
    ]);

    const adapter = new DinoBrainApiAdapter({ pollingDelay: 0 });
    const result = await adapter.generate('test keyword');

    expect(result.title).toBe('Título');
    expect(result.body).toContain('Cuerpo del artículo');
    expect(result.body).not.toContain('<h1>');
  });

  it('accepts JSON ID from generaContenido.php (legacy format)', async () => {
    const html = '<div id="textodelcontenido"><h1>Legacy</h1><p>Contenido</p></div>';
    mockApi([
      JSON.stringify({ status: 'OK', message: '304041' }), // legacy JSON ID
      'finalizado',
      html,
    ]);

    const adapter = new DinoBrainApiAdapter({ pollingDelay: 0 });
    const result = await adapter.generate('legacy kw');

    expect(result.title).toBe('Legacy');
    expect(result.body).toContain('Contenido');
  });

  it('extracts content from #textodelcontenido div', async () => {
    const html = `
      <html><body>
        <div class="ui-buttons">Botones de DinoRank</div>
        <div id="textodelcontenido">
          <h1>Mi Artículo SEO</h1>
          <p>Primer párrafo.</p>
          <p>Segundo párrafo.</p>
        </div>
        <script>var x=1;</script>
      </body></html>
    `;
    mockApi(['12345', 'finalizado', html]);

    const adapter = new DinoBrainApiAdapter({ pollingDelay: 0 });
    const result = await adapter.generate('seo keyword');

    expect(result.title).toBe('Mi Artículo SEO');
    expect(result.body).toContain('Primer párrafo');
    expect(result.body).not.toContain('Botones de DinoRank');
    expect(result.body).not.toContain('<script>');
    expect(result.body).not.toContain('<h1>');
  });

  it('falls back to full HTML when #textodelcontenido is not found', async () => {
    const html = '<p>Some content without the expected container</p>';
    mockApi(['99999', 'finalizado', html]);

    const adapter = new DinoBrainApiAdapter({ pollingDelay: 0 });
    const result = await adapter.generate('test');

    expect(result.body).toBe(html);
    expect(result.title).toBe('Post sobre test');
  });

  it('uses fallback title when h1 is missing inside the container', async () => {
    const html = '<div id="textodelcontenido"><p>Solo cuerpo sin título</p></div>';
    mockApi(['11111', 'finalizado', html]);

    const adapter = new DinoBrainApiAdapter({ pollingDelay: 0 });
    const result = await adapter.generate('mi keyword');

    expect(result.title).toBe('Post sobre mi keyword');
    expect(result.body).toContain('Solo cuerpo sin título');
  });

  it('polls until finalizado before downloading', async () => {
    const html = '<div id="textodelcontenido"><h1>T</h1><p>X</p></div>';
    mockApi([
      '55555',        // generaContenido
      'Progreso: 30%',// controlIA attempt 1
      'Progreso: 70%',// controlIA attempt 2
      'finalizado',   // controlIA attempt 3
      html,           // obtieneContenidoGenerado
    ]);

    const adapter = new DinoBrainApiAdapter({ pollingDelay: 0 });
    const result = await adapter.generate('kw');

    expect(result.title).toBe('T');
    expect(result.body).toContain('X');
  });

  it('tries next account if first account login fails', async () => {
    const account2 = { email: 'b@b.com', password: 'pass2', contentCredits: 3 };
    (registry.loadRegistry as any).mockReturnValue([ACCOUNT, account2]);

    const html = '<div id="textodelcontenido"><h1>Fallback</h1><p>OK</p></div>';
    let callCount = 0;
    (DinoRankApiClient as any).mockImplementation(class {
      login = vi.fn().mockImplementation(() => {
        callCount++;
        return callCount === 1 ? Promise.resolve('failed') : Promise.resolve('ok');
      });
      post = vi.fn()
        .mockResolvedValueOnce('77777')
        .mockResolvedValueOnce('finalizado')
        .mockResolvedValueOnce(html);
      get = vi.fn().mockResolvedValue('Consumos restantes: 5');
      extractContentCredits = vi.fn().mockReturnValue(5);
    });

    const adapter = new DinoBrainApiAdapter({ pollingDelay: 0 });
    const result = await adapter.generate('kw');

    expect(result.title).toBe('Fallback');
    expect(callCount).toBe(2);
  });
});
