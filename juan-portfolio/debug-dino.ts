import { chromium } from 'playwright'
import { readFileSync, existsSync, writeFileSync } from 'fs'

async function debugDOM() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()

  if (existsSync('content/dinorank-kw-session.json')) {
    const cookies = JSON.parse(readFileSync('content/dinorank-kw-session.json', 'utf-8'))
    await context.addCookies(cookies)
  }

  const page = await context.newPage()
  await page.goto('https://dinorank.com/keyword-research/', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)

  const html = await page.content()
  writeFileSync('/tmp/dinorank-debug-page.html', html)

  const buttonsInfo = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, input[type="submit"], a.btn'))
      .map((b) => ({
        tagName: b.tagName,
        id: b.id,
        className: b.className,
        text: (b as HTMLElement).innerText?.trim() || (b as HTMLInputElement).value,
      }))
      .filter(
        (b) =>
          (b.text && b.text.toLowerCase().includes('analizar')) ||
          b.id.toLowerCase().includes('busca'),
      )
  })

  console.log(JSON.stringify(buttonsInfo, null, 2))

  await browser.close()
}

debugDOM().catch(console.error)
