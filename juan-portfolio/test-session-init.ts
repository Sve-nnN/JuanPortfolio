import { DinoRankApiClient } from './src/scripts/dinorank/DinoRankApiClient'
import { loadRegistry } from './src/scripts/utils/accountRegistry'
import { CONTENT_EXCLUSIONS, WRITING_INSTRUCTIONS } from './src/scripts/config/engine-prompts'

async function testSessionInit() {
  const registry = loadRegistry()
  const account = registry[0]
  const client = new DinoRankApiClient(account.email, account.password)

  try {
    console.log('🧪 TEST: Session initialization sequence\n')

    // Step 1: Login
    console.log('Step 1: Login')
    const loginResult = await client.login('es')
    console.log(`   Result: ${loginResult}\n`)

    if (loginResult !== 'ok') {
      console.log('❌ Login failed')
      return
    }

    // Step 2: Get DinoBrain page
    console.log('Step 2: GET /dinobrain/')
    const referer = 'https://dinorank.com/dinobrain/'
    const brainPage = await client.get(referer, referer)
    console.log(`   Page length: ${brainPage.length}`)
    console.log(`   Has generaContenido: ${brainPage.includes('generaContenido')}`)
    console.log(`   Has script: ${brainPage.includes('script')}`)
    console.log()

    // Step 3: Check if we need a GET first
    console.log('Step 3: GET the /es/ajax/generaContenido.php endpoint')
    const ajaxGet = await client.get('https://dinorank.com/es/ajax/generaContenido.php', referer)
    console.log(`   Response: '${ajaxGet}' (length: ${ajaxGet.length})\n`)

    // Step 4: POST with minimal body
    console.log('Step 4: POST with minimal body')
    const minimalBody = new URLSearchParams({
      keyword: 'test',
      idioma: 'es',
    }).toString()
    
    const ajaxPostMin = await client.post(
      'https://dinorank.com/es/ajax/generaContenido.php',
      minimalBody,
      referer,
    )
    console.log(`   Response (first 300): ${ajaxPostMin.substring(0, 300)}`)
    console.log(`   Response length: ${ajaxPostMin.length}\n`)

    // Step 5: POST with full body
    console.log('Step 5: POST with full body')
    const fullBody = new URLSearchParams({
      t: String(Date.now()),
      keyword: 'prueba contenido',
      imagenes: 'no',
      contexto: 'Test context',
      exclusiones: CONTENT_EXCLUSIONS,
      numPalabras: '2000',
      keyword_idioma: 'Spanish',
      idioma: 'es',
      keyword_pais: 'ES',
      pais: 'ES',
    }).toString()

    const ajaxPostFull = await client.post(
      'https://dinorank.com/es/ajax/generaContenido.php',
      fullBody,
      referer,
    )
    console.log(`   Response (first 300): ${ajaxPostFull.substring(0, 300)}`)
    console.log(`   Response length: ${ajaxPostFull.length}`)
    console.log(`   Is JSON: ${ajaxPostFull.trim().startsWith('{') || ajaxPostFull.trim().startsWith('[')}`)
    console.log(`   Is HTML: ${ajaxPostFull.includes('<!DOCTYPE')}`)

  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    await client.logout()
  }
}

testSessionInit().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
