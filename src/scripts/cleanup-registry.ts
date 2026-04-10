import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const registryFile = resolve(process.cwd(), 'content/dinorank-accounts-registry.json')
const registry = JSON.parse(readFileSync(registryFile, 'utf-8'))

// Filter out accounts not yet created on DinoRank (the new English account)
const filtered = registry.filter((acc: any) => acc.createdLanguage !== 'English' || acc.contentCredits === undefined || acc.contentCredits > 0)

// Actually, just remove the English ones since they're not created yet
const finalFiltered = registry.filter((acc: any) => acc.createdLanguage !== 'English')

console.log(`[cleanup] Removed ${registry.length - finalFiltered.length} account(s)`)
console.log(`[cleanup] Remaining Spanish accounts: ${finalFiltered.length}`)

writeFileSync(registryFile, JSON.stringify(finalFiltered, null, 2))
console.log('[cleanup] ✅ Ready to generate with Spanish accounts')
