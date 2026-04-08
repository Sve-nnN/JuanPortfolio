import * as p from '@clack/prompts'
import { chromium } from 'playwright'
import { loadRegistry, saveRegistry, updateAccount } from './utils/accountRegistry'
import { writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const KW_SESSION_FILE = join(process.cwd(), 'content/dinorank-kw-session.json')

async function validateAccounts() {
  p.intro('🕵️ Auditor de Cuentas DinoRank')
  
  const registry = loadRegistry()
  if (registry.length === 0) {
    p.log.error('El registro está vacío.')
    return
  }

  p.log.info(`Encontradas ${registry.length} cuentas para validar.`)
  const results = []

  for (const acc of registry) {
    const s = p.spinner()
    s.start(`Validando: ${acc.email}...`)
    
    const browser = await chromium.launch({ headless: false, slowMo: 100 })
    const context = await browser.newContext()
    const page = await context.newPage()

    try {
      // 1. Ir a login
      await page.goto('https://dinorank.com/login/', { waitUntil: 'domcontentloaded' })
      
      // 2. Intentar Login
      const userField = page.locator('#usuario')
      if (await userField.isVisible()) {
        await page.fill('#usuario', acc.email)
        await page.fill('#password', acc.password)
        await page.click('#botonLogin')
        await page.waitForTimeout(3000)
      }

      // 3. Verificar si estamos dentro
      const isLoggedIn = await page.evaluate(() => {
        return !!document.querySelector("#enlaceCierraCabecera") || 
               document.body.innerText.toLowerCase().includes("cerrar sesión")
      })

      if (!isLoggedIn) {
        // Mirar si hay mensaje de error
        const error = await page.evaluate(() => (document.querySelector('.swal2-html-container') as HTMLElement)?.innerText || 'Credenciales inválidas')
        updateAccount(acc.email, { kwCredits: 0, contentCredits: 0 })
        s.stop(`❌ ${acc.email}: FAILED (${error})`)
        results.push({ email: acc.email, status: 'FAILED', error })
        continue
      }

      // 4. Extraer Créditos Reales
      const credits: any = await page.evaluate(() => {
        const el = document.querySelector('.divlimites') as HTMLElement
        if (!el) return null
        const text = el.innerText
        const kwMatch = text.match(/Keyword Research[:\s]*(\d+)/i)
        const contentMatch = text.match(/DinoBRAIN[:\s]*(\d+)/i)
        return { 
          kw: kwMatch ? parseInt(kwMatch[1], 10) : 0, 
          content: contentMatch ? parseInt(contentMatch[1], 10) : 0 
        }
      })

      if (credits) {
        updateAccount(acc.email, { 
          kwCredits: credits.kw, 
          contentCredits: credits.content,
          lastUsed: new Date().toISOString()
        })
        s.stop(`✅ ${acc.email}: KW:${credits.kw} | BRAIN:${credits.content}`)
        results.push({ email: acc.email, status: 'OK', kw: credits.kw, content: credits.content })
        
        // Guardar sesión para el scraper principal
        const cookies = await context.cookies()
        writeFileSync(KW_SESSION_FILE, JSON.stringify(cookies, null, 2))
      } else {
        s.stop(`⚠️ ${acc.email}: Logueado pero no se detectaron límites.`)
        results.push({ email: acc.email, status: 'UNKNOWN' })
      }

    } catch (err: any) {
      s.stop(`❌ ${acc.email}: ERROR (${err.message})`)
      results.push({ email: acc.email, status: 'ERROR', error: err.message })
    } finally {
      await browser.close()
    }
  }

  p.outro('Auditoría completada. El registro ha sido actualizado.')
  
  console.table(results)
}

validateAccounts().catch(console.error)
