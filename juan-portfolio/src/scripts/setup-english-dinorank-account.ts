/**
 * Script to:
 * 1. Mark existing DinoRank accounts as Spanish
 * 2. Create a new account specifically for English content generation
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { DinoRankApiClient } from './dinorank/DinoRankApiClient'
import { registerAccount } from './utils/accountRegistry'

const REGISTRY_FILE = resolve(process.cwd(), 'content/dinorank-accounts-registry.json')

function randomStr(len: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function randomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let result = ''
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

async function main() {
  console.log('[setup-english-dinorank] Starting...')

  // Step 1: Update existing accounts to mark as Spanish
  console.log('[setup-english-dinorank] Step 1: Marking existing accounts as Spanish...')
  const registry = JSON.parse(readFileSync(REGISTRY_FILE, 'utf-8'))
  
  let updated = 0
  for (const account of registry) {
    if (!account.createdLanguage) {
      account.createdLanguage = 'Spanish'
      account.createdCountry = 'ES'
      account.createdProjectType = 'nicho'
      account.createdDomain = 'juan-tech.com'
      updated++
    }
  }
  writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2))
  console.log(`[setup-english-dinorank] Updated ${updated} accounts to mark as Spanish`)

  // Step 2: Create a new account for English
  console.log('[setup-english-dinorank] Step 2: Creating new English account...')
  
  const email = `${randomStr(8)}${randomStr(4)}@gmail.com`
  const password = randomPassword()
  const registerUrl = 'https://dinorank.com/registro/?codPromo=dinoTrial25'

  console.log(`[setup-english-dinorank] Email: ${email}`)
  
  const api = new DinoRankApiClient(email, password)

  try {
    // Get initial cookies
    console.log('[setup-english-dinorank] Getting registration page...')
    const initRes = await fetch(registerUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    })
    const h = initRes.headers as unknown as { getSetCookie?: () => string[] }
    const setCookies = typeof h.getSetCookie === 'function' ? h.getSetCookie() : []
    api['mergeCookies'](setCookies)

    // Perform registration
    console.log('[setup-english-dinorank] Registering account...')
    const regBody = `email=${encodeURIComponent(email)}&clave=${encodeURIComponent(password)}&elemento=&telefono=%2B34666000000`
    const regRes = await api['post']('https://dinorank.com/ajax/registro1.php', regBody, registerUrl)

    if (!regRes.includes('creado satisfactoriamente')) {
      throw new Error(`Registration failed: ${regRes.slice(0, 100)}`)
    }

    // Initialize onboarding with ENGLISH
    console.log('[setup-english-dinorank] Initializing onboarding in English...')
    await api['get']('https://dinorank.com/en/homed/', registerUrl)
    await api['get']('https://dinorank.com/en/onboarding/', 'https://dinorank.com/en/homed/')

    // Complete multi-step onboarding
    console.log('[setup-english-dinorank] Completing onboarding...')
    await api.completeOnboarding()

    // Logout
    console.log('[setup-english-dinorank] Logging out...')
    await api.logout()

    // Register in our system
    console.log('[setup-english-dinorank] Registering account in our system...')
    registerAccount(email, password, {
      language: 'English',
      country: 'US',
      domain: 'juan-tech.com',
      projectType: 'nicho',
    })

    console.log('[setup-english-dinorank] ✅ English account created successfully!')
    console.log(`[setup-english-dinorank] Email: ${email}`)
    console.log(`[setup-english-dinorank] Password: ${password}`)
    console.log('[setup-english-dinorank] Account is ready for English content generation')
  } catch (error) {
    console.error('[setup-english-dinorank] ❌ Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
