/**
 * Simple setup for English language support
 * Marks existing accounts as Spanish and provides instructions for English account
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
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
  console.log('[english-setup] Starting setup...')

  // Step 1: Update existing accounts to mark as Spanish
  console.log('[english-setup] Step 1: Marking existing accounts as Spanish...')
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
  console.log(`[english-setup] ✅ Updated ${updated} accounts to Spanish`)

  // Step 2: Create an English account entry
  console.log('[english-setup] Step 2: Creating English account entry...')
  
  const email = `${randomStr(8)}${randomStr(4)}@gmail.com`
  const password = randomPassword()

  registerAccount(email, password, {
    language: 'English',
    country: 'US',
    domain: 'juan-tech.com',
    projectType: 'nicho',
  })

  console.log('[english-setup] ✅ English account registered in system:')
  console.log(`[english-setup] Email: ${email}`)
  console.log(`[english-setup] Password: ${password}`)
  console.log('')
  console.log('[english-setup] 📋 NEXT STEPS:')
  console.log('[english-setup] 1. Visit https://dinorank.com/en/registration/')
  console.log('[english-setup] 2. Use promo code: dinoTrial25')
  console.log('[english-setup] 3. Create account with the email and password above')
  console.log('[english-setup] 4. Complete onboarding on the English version of DinoRank')
  console.log('[english-setup] 5. The system will automatically use this account for English content')
  console.log('')
  console.log('[english-setup] ✅ Setup complete. Ready to generate English content.')
}

main().catch(e => {
  console.error('[english-setup] ❌ Error:', e instanceof Error ? e.message : String(e))
  process.exit(1)
})
