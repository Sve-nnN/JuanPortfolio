import fs from 'fs'
import path from 'path'

const REGISTRY_FILE = path.resolve(process.cwd(), 'content/dinorank-accounts-registry.json')

export interface AccountEntry {
  email: string
  password: string
  keywords: string[]
  content: string[]
  kwCredits: number
  contentCredits: number
  createdAt: string
  expiresAt: string
  lastUsed: string
  cooldownUntil?: string
  createdLanguage?: string
  createdCountry?: string
  createdDomain?: string
  createdProjectType?: string
}

export function loadRegistry(): AccountEntry[] {
  if (!fs.existsSync(REGISTRY_FILE)) return []
  try {
    const data = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf-8'))
    const now = new Date()
    // Auto-filter expired or invalid accounts (kwCredits -1 means permanently broken)
    return data.filter((a: AccountEntry) => {
      if (!a.expiresAt) return true // Legacy
      const isExpired = new Date(a.expiresAt) < now
      const isInvalid = a.kwCredits === -1
      return !isExpired && !isInvalid
    })
  } catch {
    return []
  }
}

export function saveRegistry(registry: AccountEntry[]): void {
  fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2))
}

export function updateAccount(email: string, updates: Partial<AccountEntry>): void {
  const registry = loadRegistry()
  const idx = registry.findIndex(a => a.email === email)
  if (idx !== -1) {
    registry[idx] = { ...registry[idx], ...updates, lastUsed: new Date().toISOString() }
    saveRegistry(registry)
  }
}

/** Deletes an account from the registry permanently. */
export function deleteAccount(email: string): void {
  const registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf-8'))
  const filtered = registry.filter((a: any) => a.email !== email)
  fs.writeFileSync(REGISTRY_FILE, JSON.stringify(filtered, null, 2))
}

export function registerAccount(email: string, pass: string): AccountEntry {
  const now = new Date()
  const expires = new Date()
  expires.setDate(now.getDate() + 7)

  const newAcc: AccountEntry = {
    email,
    password: pass,
    kwCredits: 150,
    contentCredits: 5,
    keywords: [],
    content: [],
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    lastUsed: now.toISOString()
  }

  const registry = loadRegistry()
  registry.push(newAcc)
  saveRegistry(registry)
  return newAcc
}

export function addKeywordToAccount(email: string, keyword: string): void {
  const registry = loadRegistry()
  const acc = registry.find(a => a.email === email)
  if (acc && !acc.keywords.includes(keyword)) {
    acc.keywords.push(keyword)
    acc.lastUsed = new Date().toISOString()
    saveRegistry(registry)
  }
}

export function addContentToAccount(email: string, slug: string): void {
  const registry = loadRegistry()
  const acc = registry.find(a => a.email === email)
  if (acc && !acc.content.includes(slug)) {
    acc.content.push(slug)
    acc.contentCredits = Math.max(0, acc.contentCredits - 1)
    acc.lastUsed = new Date().toISOString()
    saveRegistry(registry)
  }
}
