/**
 * Fix script: deduplicates categories on posts and corrects known mis-assignments.
 * Run with: npx tsx src/scripts/fix-categories.ts
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const CATEGORY_IDS = {
  'tech-seo': '697d1beb4f245196b66582a9',
  'cs-fundamentals': '698baaf14d317b057666b9b1',
  seo: '699f08bdaa45592f334fdbe3',
  development: '69cb4ac193854686c29b8b45',
  general: '69a22fee0526165306a2d3ac',
}

// Posts that have a wrong category and need reassignment (slug → correct category)
const REASSIGN: Record<string, keyof typeof CATEGORY_IDS> = {
  'que-es-css': 'cs-fundamentals',
}

async function main() {
  const payload = await getPayload({ config })

  const { docs: posts } = await payload.find({
    collection: 'posts',
    limit: 200,
    depth: 1,
  })

  console.log(`Found ${posts.length} posts.\n`)

  let fixed = 0

  for (const post of posts) {
    const slug = post.slug as string
    const cats = (post.categories as { id: string }[] | null) ?? []
    const catIds = cats.map((c) => c.id)

    // Deduplicate
    const uniqueIds = [...new Set(catIds)]
    const hasDuplicates = uniqueIds.length !== catIds.length

    // Check for known mis-assignment
    const correctCatKey = REASSIGN[slug]
    const correctCatId = correctCatKey ? CATEGORY_IDS[correctCatKey] : null
    const needsReassign = correctCatId && (uniqueIds.length !== 1 || uniqueIds[0] !== correctCatId)

    if (!hasDuplicates && !needsReassign) {
      continue
    }

    let newCatIds = uniqueIds

    if (needsReassign) {
      newCatIds = [correctCatId]
      console.log(`REASSIGN  ${slug}  → ${correctCatKey} (was: ${catIds.join(', ')})`)
    } else if (hasDuplicates) {
      console.log(`DEDUP     ${slug}  [${catIds.join(', ')}] → [${newCatIds.join(', ')}]`)
    }

    await payload.update({
      collection: 'posts',
      id: post.id as string,
      data: {
        categories: newCatIds,
      },
      context: { disableRevalidate: true },
    })

    fixed++
  }

  console.log(`\nDone. Fixed: ${fixed} post(s).`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
