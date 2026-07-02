import { createDinoRankAccount } from './scrape-dinorank'
import { DinoRankApiClient } from './dinorank/DinoRankApiClient'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

async function main() {
  const keywords = [
    { kw: "Canibalización SEO", country: "es", lang: "es" },
    { kw: "SEO Cannibalization", country: "us", lang: "en" },
    { kw: "Guía Google Search Console 2026", country: "es", lang: "es" },
    { kw: "Google Search Console guide 2026", country: "us", lang: "en" },
    { kw: "JavaScript SEO", country: "es", lang: "es" },
    { kw: "JavaScript SEO", country: "us", lang: "en" },
    { kw: "Recursividad", country: "es", lang: "es" },
    { kw: "Recursion", country: "us", lang: "en" },
    { kw: "Pilas y Colas", country: "es", lang: "es" },
    { kw: "Stacks and Queues", country: "us", lang: "en" },
    { kw: "React 19", country: "es", lang: "es" },
    { kw: "React 19", country: "us", lang: "en" },
    { kw: "Hidratación Web", country: "es", lang: "es" },
    { kw: "Web Hydration", country: "us", lang: "en" }
  ]

  console.log("Creating account for research...")
  const acc = await createDinoRankAccount("es", "ES")
  const api = new DinoRankApiClient(acc.email, acc.password)
  await api.login("es")

  const results = []
  for (const item of keywords) {
    console.log(`Researching ${item.kw} in ${item.country}...`)
    try {
        // DinoRank keyword research logic simplified
        const res = await api.post('https://dinorank.com/ajax/kresearch.php', `p=${item.country}&k=${encodeURIComponent(item.kw)}`, 'https://dinorank.com/keyword-research/')
        const data = JSON.parse(res)
        const metrics = data.result?.[0] || { volume: "0", difficulty: "0" }
        results.push({ ...item, volume: metrics.volume, difficulty: metrics.difficulty })
        console.log(`  Volume: ${metrics.volume}, Diff: ${metrics.difficulty}`)
    } catch (e) {
        console.error(`  Failed: ${e instanceof Error ? e.message : String(e)}`)
        results.push({ ...item, volume: "N/A", difficulty: "N/A" })
    }
  }

  console.log("Updating gaps-de-contenido.md...")
  let gaps = readFileSync('content/gaps-de-contenido.md', 'utf-8')
  for (const res of results) {
    const searchStr = res.lang === 'es' ? res.kw : res.kw
    // Update the description or add a line
    gaps = gaps.replace(new RegExp(`${res.kw}`, 'g'), `${res.kw} (Vol: ${res.volume}, Diff: ${res.difficulty})`)
  }
  writeFileSync('content/gaps-de-contenido.md', gaps)
  console.log("Done.")
}

main().catch(console.error)