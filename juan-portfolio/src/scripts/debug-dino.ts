import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

async function main() {
  console.log('Iniciando browser...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  })
  const page = await context.newPage()

  try {
    console.log('Restaurando sesión...')
    const cookiesPath = join(process.cwd(), 'content/dinorank-session.json')
    const cookies = JSON.parse(readFileSync(cookiesPath, 'utf-8'))
    await context.addCookies(cookies)

    console.log('Navegando a Keyword Research...')
    await page.goto('https://dinorank.com/keyword-research/', { waitUntil: 'load', timeout: 30000 })

    const isLogin = page.url().includes('/login')
    if (isLogin) {
      console.log('FALLO: La cookie no sirvió o caducó. Nos redirigió a login.')
      return
    }

    console.log('Esperando .kresearchInputKeyword...')
    await page.waitForSelector('.kresearchInputKeyword', { timeout: 10000 })

    console.log('Cerrando overlays...')
    await page
      .evaluate(() => {
        if (typeof (window as any).omitirtodotooltip === 'function') {
          ;(window as any).omitirtodotooltip()
        }
        const closeButtons = [
          '.swal2-confirm',
          '.swal2-close',
          '.introjs-skipbutton',
          '.btn-close',
          '[data-dismiss="modal"]',
          '#btn-omitir-tutorial',
          '#skipBtn',
        ]
        for (const sel of closeButtons) {
          const btns = document.querySelectorAll(sel)
          btns.forEach((btn: any) => {
            if (btn && btn.click) btn.click()
          })
        }
      })
      .catch(() => {})

    await page.waitForTimeout(2000)

    console.log('Tomando dump ANTES del fill...')
    const html = await page.content()
    writeFileSync('/tmp/dinoresearch-dump.html', html)

    console.log('Buscando botones y selectores principales...')
    const data = await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll('form')).map((f) => f.id)
      const inputs = Array.from(document.querySelectorAll('input')).map((i) => ({
        id: i.id,
        name: i.name,
        class: i.className,
      }))
      const buttons = Array.from(document.querySelectorAll('button')).map((b) => ({
        id: b.id,
        class: b.className,
        text: b.innerText,
      }))
      const aTags = Array.from(document.querySelectorAll('a'))
        .filter(
          (a) =>
            a.innerText.toLowerCase().includes('buscar') ||
            a.innerText.toLowerCase().includes('analizar'),
        )
        .map((a) => ({ id: a.id, class: a.className, text: a.innerText }))
      return { forms, inputs, buttons, aTags }
    })

    console.log(JSON.stringify(data, null, 2))
  } catch (e) {
    console.error('Error in debug script:', e)
  } finally {
    await browser.close()
  }
}

main().catch(console.error)
