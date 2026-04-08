import { DinoRankApiClient } from './src/scripts/dinorank/DinoRankApiClient'
import { loadRegistry } from './src/scripts/utils/accountRegistry'

async function quickTest() {
  const account = loadRegistry()[0]
  const client = new DinoRankApiClient(account.email, account.password)
  
  try {
    const loginResult = await client.login('es')
    console.log('✅ Login:', loginResult)
    
    const response = await client.post(
      'https://dinorank.com/es/ajax/generaContenido.php',
      'keyword=test&idioma=es',
      'https://dinorank.com/dinobrain/',
    )
    
    console.log('Response starts with:', response.substring(0, 50))
    console.log('Is JSON:', response.trim()[0] === '{' || response.trim()[0] === '[')
    console.log('Is HTML:', response.includes('DOCTYPE'))
    console.log('Response length:', response.length)
  } finally {
    await client.logout()
  }
}

quickTest().catch(e => console.error(String(e)))
