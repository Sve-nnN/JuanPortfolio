import { DinoRankApiClient } from './src/scripts/dinorank/DinoRankApiClient'
import { loadRegistry } from './src/scripts/utils/accountRegistry'

async function testVariations() {
  const registry = loadRegistry()
  const account = registry[0]

  const client = new DinoRankApiClient(account.email, account.password)

  try {
    console.log('🧪 PRUEBAS DE ENDPOINTS ALTERNATIVOS\n')

    // Login
    const loginResult = await client.login('es')
    if (loginResult !== 'ok') {
      console.log('❌ Login failed')
      return
    }

    const baseReferer = 'https://dinorank.com/dinobrain/'

    // Test 1: Simple minimal request
    console.log('Test 1: Minimal generaContenido request')
    let response = await client.post(
      'https://dinorank.com/ajax/generaContenido.php',
      new URLSearchParams({
        keyword: 'test',
        idioma: 'es',
      }).toString(),
      baseReferer,
    )
    console.log(`   Response length: ${response.length}\n`)

    // Test 2: Try alternate endpoint
    console.log('Test 2: Try /es/ajax/generaContenido.php')
    response = await client.post(
      'https://dinorank.com/es/ajax/generaContenido.php',
      new URLSearchParams({
        keyword: 'test',
        idioma: 'es',
      }).toString(),
      baseReferer,
    )
    console.log(`   Response length: ${response.length}\n`)

    // Test 3: Check if we can access dinobrain page with script
    console.log('Test 3: Check for dinobrain script/form elements')
    const brainPage = await client.get(baseReferer, baseReferer)
    const hasGeneraContenido = brainPage.includes('generaContenido')
    const hasAjaxCall = brainPage.includes('/ajax/')
    const hasDinobrain = brainPage.includes('dinobrain')
    
    console.log(`   Page contains 'generaContenido': ${hasGeneraContenido}`)
    console.log(`   Page contains '/ajax/': ${hasAjaxCall}`)
    console.log(`   Page contains 'dinobrain': ${hasDinobrain}\n`)

    // Test 4: List AI endpoints mentioned in page
    console.log('Test 4: AI-related functions in page')
    const matches = brainPage.match(/\/ajax\/[a-zA-Z]*contenido[a-zA-Z]*\.php/gi) || []
    if (matches.length > 0) {
      const unique = [...new Set(matches)]
      console.log(`   Found endpoints: ${unique.join(', ')}\n`)
    } else {
      console.log(`   No AI endpoints found\n`)
    }

    // Test 5: Check page size and key sections
    console.log('Test 5: Page structure analysis')
    console.log(`   Total page size: ${brainPage.length} bytes`)
    console.log(`   Has form: ${brainPage.includes('<form')}`)
    console.log(`   Has input#keyword: ${brainPage.includes('id="keyword"')}`)
    console.log(`   Has generate button: ${brainPage.includes('generar') || brainPage.includes('generate')}`)

  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    await client.logout()
  }
}

testVariations().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
