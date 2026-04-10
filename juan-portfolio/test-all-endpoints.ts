import { DinoRankApiClient } from './src/scripts/dinorank/DinoRankApiClient'
import { loadRegistry } from './src/scripts/utils/accountRegistry'

async function testAllAjaxEndpoints() {
  const registry = loadRegistry()
  const account = registry[0]
  const client = new DinoRankApiClient(account.email, account.password)

  try {
    console.log('🧪 TESTING AJAX ENDPOINTS\n')

    const loginResult = await client.login('es')
    if (loginResult !== 'ok') {
      console.log('❌ Login failed')
      return
    }

    const baseReferer = 'https://dinorank.com/dinobrain/'
    const endpoints = [
      'generaContenido',
      'controlIA',
      'obtieneContenidoGenerado',
    ]

    for (const endpoint of endpoints) {
      console.log(`Testing: ${endpoint}`)
      
      // Test with /ajax/
      const testBody = new URLSearchParams({
        t: String(Date.now()),
        id: '12345',
      }).toString()

      console.log(`  /ajax/${endpoint}.php:`, end = '')
      const resp1 = await client.post(
        `https://dinorank.com/ajax/${endpoint}.php`,
        testBody,
        baseReferer,
      )
      console.log(` ${resp1.length} bytes`)

      console.log(`  /es/ajax/${endpoint}.php:`, end = '')
      const resp2 = await client.post(
        `https://dinorank.com/es/ajax/${endpoint}.php`,
        testBody,
        baseReferer,
      )
      console.log(` ${resp2.length} bytes\n`)
    }

  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    await client.logout()
  }
}

testAllAjaxEndpoints().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
