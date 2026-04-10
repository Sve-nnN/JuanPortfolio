import { DinoRankApiClient } from './src/scripts/dinorank/DinoRankApiClient'
import { loadRegistry } from './src/scripts/utils/accountRegistry'

async function testRequestFormats() {
  const accounts = loadRegistry()
  const wAccounts = accounts.filter(a => a.email !== 'ijgrrjnw0bsr@gmail.com')  // Skip device_conflict
  
  if (wAccounts.length === 0) {
    console.log('No working accounts')
    return
  }
  
  const account = wAccounts[0]
  const client = new DinoRankApiClient(account.email, account.password)
  
  try {
    const loginResult = await client.login('es')
    if (loginResult !== 'ok') {
      console.log(`Login failed: ${loginResult}`)
      return
    }
    
    console.log(`🧪 Testing different POST formats with ${account.email}\n`)
    
    const referer = 'https://dinorank.com/dinobrain/'
    
    // Test 1: Try with different URL
    const urls = [
      'https://dinorank.com/es/ajax/generaContenido.php',
      'https://dinorank.com/ajax/generaContenido.php',
      'https://dinorank.com/es/dinobrain-api/generaContenido',
      'https://dinorank.com/api/dinobrain/generaContenido',
    ]
    
    for (const url of urls) {
      try {
        const resp = await client.post(
          url,
          'keyword=test&idioma=es',
          referer,
        )
        
        const start = resp.substring(0, 100)
        const isJson = resp.trim()[0] === '{' || resp.trim()[0] === '['
        const isNum = /^\d+$/.test(resp.trim())
        const isHtml = start.includes('DOCTYPE') || start.includes('html')
        
        console.log(`${url}`)
        console.log(`  Response: ${isJson ? 'JSON' : isNum ? 'NUMBER' : isHtml ? 'HTML' : 'OTHER'} (${resp.length} bytes)`)
        console.log`  First 60 chars: ${resp.substring(0, 60)}`)
        console.log()
      } catch (err) {
        console.log(`${url}: ERROR`)
      }
    }
    
  } finally {
    await client.logout()
  }
}

testRequestFormats().catch(e => console.error(String(e)))
