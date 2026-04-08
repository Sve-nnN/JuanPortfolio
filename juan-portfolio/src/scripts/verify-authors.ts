/**
 * Verify all published posts have authors assigned.
 */
import { getPayload } from 'payload'
import config from '../payload.config'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

async function main() {
  const payload = await getPayload({ config })

  let page = 1
  let hasMore = true
  let totalPublished = 0
  let missing = 0
  const missingList: string[] = []
  const coveredList: string[] = []

  while (hasMore) {
    const batch = await payload.find({
      collection: 'posts',
      overrideAccess: true,
      where: { _status: { equals: 'published' } },
      limit: 50,
      page,
      depth: 1,
    })

    totalPublished = batch.totalDocs

    for (const post of batch.docs) {
      const authors = post.authors
      const hasAuthor = Array.isArray(authors) && authors.length > 0
      if (!hasAuthor) {
        missing++
        missingList.push(String(post.slug || post.id))
      } else {
        coveredList.push(String(post.slug || post.id))
      }
    }

    hasMore = batch.hasNextPage
    page++
  }

  console.log(`Total published posts: ${totalPublished}`)
  console.log(`With author: ${coveredList.length}`)
  console.log(`Missing author: ${missing}`)
  if (missingList.length > 0) {
    console.log('Missing:', missingList)
  }
  console.log('Covered:', coveredList)

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
