import fs from 'fs'
import path from 'path'

const CACHE_FILE = path.join(process.cwd(), '.serpapi-cache.json')

export interface CachedData {
  timestamp: number
  data: unknown
}

export class SerpCache {
  private cache: Record<string, CachedData> = {}

  constructor() {
    this.load()
  }

  private load() {
    if (fs.existsSync(CACHE_FILE)) {
      try {
        this.cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
      } catch (_e) {
        this.cache = {}
      }
    }
  }

  private save() {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(this.cache, null, 2))
  }

  get(keyword: string, locale: string): unknown | null {
    const key = `${keyword}:${locale}`
    const entry = this.cache[key]
    if (!entry) return null

    // Cache valid for 7 days
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    if (Date.now() - entry.timestamp > sevenDays) {
      delete this.cache[key]
      this.save()
      return null
    }

    return entry.data
  }

  set(keyword: string, locale: string, data: unknown) {
    const key = `${keyword}:${locale}`
    this.cache[key] = {
      timestamp: Date.now(),
      data
    }
    this.save()
  }
}
