import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const registryFile = resolve(process.cwd(), 'content/dinorank-accounts-registry.json')
const registry = JSON.parse(readFileSync(registryFile, 'utf-8'))

// Remove the problematic account
const filtered = registry.filter((acc: any) => acc.email !== 'zv8ncaqmfsde@gmail.com')

console.log(`[fix] Removed account with device conflict`)
console.log(`[fix] Remaining: ${filtered.length} accounts`)

writeFileSync(registryFile, JSON.stringify(filtered, null, 2))
console.log('[fix] ✅ Registry fixed')
