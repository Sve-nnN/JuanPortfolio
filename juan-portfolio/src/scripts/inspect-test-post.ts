import { getPayload } from 'payload'
import config from '../payload.config'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

async function main() {
  const payload = await getPayload({ config })

  const post = await payload.find({
    collection: 'posts',
    overrideAccess: true,
    where: { slug: { equals: 'test-sync-post' } },
    limit: 1,
    depth: 0,
  })

  if (post.docs.length === 0) {
    console.log('Post not found')
    process.exit(0)
  }

  const doc = post.docs[0]
  console.log('ID:', doc.id)
  console.log('Slug:', doc.slug)
  console.log('_status:', doc._status)
  console.log('title:', doc.title)
  console.log('authors:', JSON.stringify(doc.authors))
  console.log('publishedAt:', doc.publishedAt)
  console.log('Full doc keys:', Object.keys(doc))

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
