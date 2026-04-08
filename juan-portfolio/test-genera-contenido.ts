import { DinoRankApiClient } from './src/scripts/dinorank/DinoRankApiClient'
import { loadRegistry } from './src/scripts/utils/accountRegistry'
import { CONTENT_EXCLUSIONS, WRITING_INSTRUCTIONS } from './src/scripts/config/engine-prompts'

async function testGeneraContenido() {
  const registry = loadRegistry()
  const account = registry[0]

  console.log('🧪 TEST: generaContenido.php endpoint\n')
  console.log(`📧 Account: ${account.email}\n`)

  const client = new DinoRankApiClient(account.email, account.password)

  try {
    // Login
    console.log('1️⃣ Logging in...')
    const loginResult = await client.login('es')
    console.log(`   Result: ${loginResult}\n`)

    if (loginResult !== 'ok') {
      console.log('❌ Login failed')
      return
    }

    // Check credits
    console.log('2️⃣ Checking credits...')
    const referer = 'https://dinorank.com/dinobrain/'
    const brainHtml = await client.get(referer, referer)
    const credits = client.extractContentCredits(brainHtml)
    console.log(`   Credits: ${credits}\n`)

    // Attempt generaContenido
    console.log('3️⃣ Calling generaContenido.php...')
    const context = WRITING_INSTRUCTIONS.trim()
    const generationBody = new URLSearchParams({
      t: String(Date.now()),
      keyword: 'estrategia de contenidos',
      imagenes: 'no',
      contexto: context,
      exclusiones: CONTENT_EXCLUSIONS,
      numPalabras: '2000',
      keyword_idioma: 'Spanish',
      idioma: 'es',
      keyword_pais: 'ES',
      pais: 'ES',
    })

    console.log(`   Body length: ${generationBody.toString().length}`)
    console.log(`   Body content (first 100 chars): ${generationBody.toString().substring(0, 100)}...`)

    const generationResponse = await client.post(
      'https://dinorank.com/ajax/generaContenido.php',
      generationBody.toString(),
      referer,
    )

    console.log(`   Response length: ${generationResponse.length}`)
    console.log(`   Response type: ${typeof generationResponse}`)
    console.log(`   Response empty: ${generationResponse === ''}`)
    console.log(`   Response (first 200 chars): ${generationResponse.substring(0, 200)}`)
    console.log(`   Response (last 200 chars): ${generationResponse.substring(Math.max(0, generationResponse.length - 200))}`)

    if (generationResponse) {
      try {
        const parsed = JSON.parse(generationResponse)
        console.log(`\n✅ Parsed as JSON:`)
        console.log(JSON.stringify(parsed, null, 2))
      } catch {
        console.log(`\n⚠️  Not valid JSON`)
      }
    }

  } catch (err) {
    console.error(`\n❌ Error: ${err instanceof Error ? err.message : String(err)}`)
    if (err instanceof Error && err.stack) {
      console.error(err.stack)
    }
  } finally {
    await client.logout()
  }
}

testGeneraContenido().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
