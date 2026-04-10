import { describe, it, expect, vi } from 'vitest'
import { JSDOM } from 'jsdom'

// Versión de la lógica de detección compatible con el entorno de pruebas (textContent)
function simulateDetectState(document: Document, url: string) {
  const isVisible = (el: HTMLElement | null) => el && (el.style.display !== 'none');
  const body = (document.body.textContent || '').toLowerCase()
  const lowUrl = url.toLowerCase()
  
  if (document.querySelector('#enlaceCierraCabecera')) {
    if (document.querySelector('#tablaKresearch')) return 'RESULTS_READY'
    const input = document.querySelector('#keyword') as HTMLElement
    if (isVisible(input)) return 'INPUT_READY'
    return 'LOGGED_IN'
  }

  if (lowUrl.includes('/login') || body.includes('necesario iniciar sesión')) return 'NEEDS_LOGIN'
  return 'UNKNOWN'
}

describe('DinoRank Flow Robustness', () => {
  it('detects NEEDS_LOGIN when on login page', () => {
    const dom = new JSDOM('<body><input id="usuario"></body>', { url: 'https://dinorank.com/login/' })
    const state = simulateDetectState(dom.window.document, dom.window.location.href)
    expect(state).toBe('NEEDS_LOGIN')
  })

  it('detects INPUT_READY when logged in and input is visible', () => {
    const html = `
      <body>
        <div id="enlaceCierraCabecera">Perfil</div>
        <input id="keyword" style="display:block">
      </body>
    `
    const dom = new JSDOM(html, { url: 'https://dinorank.com/keyword-research/' })
    const state = simulateDetectState(dom.window.document, dom.window.location.href)
    expect(state).toBe('INPUT_READY')
  })

  it('detects RESULTS_READY when table is present', () => {
    const html = `
      <body>
        <div id="enlaceCierraCabecera">Perfil</div>
        <table id="tablaKresearch"><tr><td>data</td></tr></table>
      </body>
    `
    const dom = new JSDOM(html)
    const state = simulateDetectState(dom.window.document, 'https://dinorank.com/keyword-research/')
    expect(state).toBe('RESULTS_READY')
  })
})
