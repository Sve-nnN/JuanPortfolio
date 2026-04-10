import { DinoRankApiClient } from './src/scripts/dinorank/DinoRankApiClient'
import { loadRegistry } from './src/scripts/utils/accountRegistry'

async function inspectPage() {
  const accounts = loadRegistry()
  const workingAccount = accounts[1]  // Use account that works
  
  const client = new DinoRankApiClient(workingAccount.email, workingAccount.password)
  
  try {
    console.log('📄 INSPECCIONANDO PÁGINA DINOBRAIN\n')
    
    const loginResult = await client.login('es')
    console.log(`Login: ${loginResult}\n`)
    
    if (loginResult !== 'ok') {
      console.log('Login failed')
      return
    }
    
    const referer = 'https://dinorank.com/dinobrain/'
    const html = await client.get(referer, referer)
    
    // Find all form elements
    console.log('Buscando formularios y funciones JavaScript...\n')
    
    const formMatches = html.match(/<form[^>]*>([\s\S]*?)<\/form>/gi) || []
    console.log(`Found forms: ${formMatches.length}`)
    
    // Find AJAX calls
    const ajaxMatches = html.match(/\.ajax\([^)]*\)|fetch\([^)]*\)|post\([^)]*\)/gi) || []
    console.log(`Found AJAX calls: ${ajaxMatches.length}`)
    if (ajaxMatches.length > 0) {
      console.log('Examples:')
      ajaxMatches.slice(0, 3).forEach(m => console.log(`  ${m.substring(0, 80)}...`))
    }
    
    console.log()
    
    // Find script tags with API references
    const scripts = html.match(/<script[^>]*src="([^"]*)"<\/script>/gi) || []
    console.log(`Found script sources: ${scripts.length}`)
    scripts.forEach(s => console.log(`  ${s}`))
    
    console.log()
    
    // Find all references to generaContenido
    const generaMatches = html.match(/generaContenido[^\s;]*/gi) || []
    console.log(`Found 'generaContenido' references: ${generaMatches.length}`)
    const unique = [...new Set(generaMatches)]
    unique.forEach(m => console.log(`  ${m}`))
    
    console.log()
    
    // Find all data attributes
    const dataAttrs = html.match(/data-[a-z-]+=["'][^"']*["']/gi) || []
    console.log(`Found data attributes: ${dataAttrs.length}`)
    dataAttrs.slice(0, 5).forEach(m => console.log(`  ${m}`))
    
  } finally {
    await client.logout()
  }
}

inspectPage().catch(e => console.error(String(e)))
