/**
 * One-shot script: assign categories to uncategorized posts.
 * Run with: npx tsx src/scripts/assign-categories.ts
 */
import { getPayload } from 'payload'
import config from '../payload.config'

// Category IDs from the CMS (confirmed via API)
const CATEGORY_IDS = {
  'tech-seo': '697d1beb4f245196b66582a9',
  'cs-fundamentals': '698baaf14d317b057666b9b1',
  seo: '699f08bdaa45592f334fdbe3',
  development: '69cb4ac193854686c29b8b45',
  general: '69a22fee0526165306a2d3ac',
}

// Mapping: post slug → category slug (derived from content/posts/<dir>/<file>)
const SLUG_TO_CATEGORY: Record<string, keyof typeof CATEGORY_IDS> = {
  // tech-seo/ directory
  'ssr-vs-csr-seo': 'tech-seo',
  'core-web-vitals-guide': 'tech-seo',
  'tech-seo-guide': 'tech-seo',
  'non-developers-guide': 'tech-seo',
  'nextjs-seo-optimization': 'tech-seo',
  'xml-sitemap-automation': 'tech-seo',
  'schema-markup-guide': 'tech-seo',
  'robots-txt-best-practices': 'tech-seo',
  'web-performance-guide': 'tech-seo',
  // cs-fundamentals/ directory
  'tablas-hash': 'cs-fundamentals',
  // seo/ directory
  'mejores-cursos-seo-espanol': 'seo',
}

async function main() {
  const payload = await getPayload({ config })

  // Fetch all posts
  const { docs: posts } = await payload.find({
    collection: 'posts',
    limit: 100,
    depth: 1,
  })

  console.log(`Found ${posts.length} posts in CMS.\n`)

  let updated = 0
  let skipped = 0

  for (const post of posts) {
    const slug = post.slug as string
    const existingCats = (post.categories as { id: string }[] | null) ?? []

    if (existingCats.length > 0) {
      console.log(`SKIP  ${slug}  (already has ${existingCats.length} category/categories)`)
      skipped++
      continue
    }

    const catKey = SLUG_TO_CATEGORY[slug]
    if (!catKey) {
      console.log(`SKIP  ${slug}  (no mapping defined — manual review needed)`)
      skipped++
      continue
    }

    const catId = CATEGORY_IDS[catKey]
    await payload.update({
      collection: 'posts',
      id: post.id as string,
      data: {
        categories: [catId],
      },
      context: { disableRevalidate: true },
    })

    console.log(`OK    ${slug}  → ${catKey} (${catId})`)
    updated++
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
