import { DinoRankApiClient } from './src/scripts/dinorank/DinoRankApiClient'
import { loadRegistry } from './src/scripts/utils/accountRegistry'

async function testAllLogins() {
  const registry = loadRegistry()
  console.log(`Testing ${registry.length} accounts...\n`)

  for (let i = 0; i < registry.length; i++) {
    const account = registry[i]
    const client = new DinoRankApiClient(account.email, account.password)
    
    try {
      const loginResult = await client.login('es')
      console.log(`[${i}] ${account.email}: ${loginResult}`)
    } catch (err) {
      console.log(`[${i}] ${account.email}: ERROR - ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      await client.logout().catch(() => {})
    }
  }
}

testAllLogins()
