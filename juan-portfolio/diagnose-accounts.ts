import { DinoRankApiClient } from './src/scripts/dinorank/DinoRankApiClient'
import { loadRegistry } from './src/scripts/utils/accountRegistry'

async function diagnoseAccounts() {
  const registry = loadRegistry()
  const now = new Date()

  console.log('🔍 DIAGNÓSTICO DE CUENTAS DINOBRAIN\n')
  console.log(`Hora actual: ${now.toISOString()}\n`)

  for (const account of registry) {
    const cooldownEnd = account.cooldownUntil ? new Date(account.cooldownUntil) : null
    const isCooldown = cooldownEnd ? cooldownEnd.getTime() > now.getTime() : false
    const expiresAt = account.expiresAt ? new Date(account.expiresAt) : null
    const isExpired = expiresAt ? expiresAt.getTime() < now.getTime() : false

    console.log(`📧 ${account.email}`)
    console.log(`   Créditos de contenido: ${account.contentCredits}`)
    console.log(`   En cooldown: ${isCooldown ? `✅ Sí (hasta ${cooldownEnd!.toISOString()})` : '❌ No'}`)
    console.log(`   Expirado: ${isExpired ? '✅ Sí' : '❌ No'}`)
    console.log(`   Lenguaje creado: ${account.createdLanguage || 'N/A'}`)
    console.log(`   País: ${account.createdCountry || 'N/A'}`)
    console.log(`   Último uso: ${account.lastUsed ? new Date(account.lastUsed).toISOString() : 'N/A'}`)
    console.log()
  }

  // Try login with first available account
  const nonCooldownAccounts = registry.filter(a => {
    const cooldownEnd = a.cooldownUntil ? new Date(a.cooldownUntil) : null
    return !cooldownEnd || cooldownEnd.getTime() <= now.getTime()
  })

  if (nonCooldownAccounts.length === 0) {
    console.log('⚠️  TODAS LAS CUENTAS ESTÁN EN COOLDOWN')
    return
  }

  console.log(`\n🧪 Intentando login con: ${nonCooldownAccounts[0].email}\n`)
  const account = nonCooldownAccounts[0]
  const client = new DinoRankApiClient(account.email, account.password)

  try {
    const loginResult = await client.login('es')
    console.log(`Login result: ${loginResult}`)

    if (loginResult === 'ok') {
      const referer = 'https://dinorank.com/dinobrain/'
      const brainHtml = await client.get(referer, referer)
      const credits = client.extractContentCredits(brainHtml)
      console.log(`Créditos disponibles en DinoBrain: ${credits}`)
      console.log(`HTML response length: ${brainHtml.length} chars`)
      console.log(`First 500 chars of response:`)
      console.log(brainHtml.substring(0, 500))
    }
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    await client.logout()
  }
}

diagnoseAccounts().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
