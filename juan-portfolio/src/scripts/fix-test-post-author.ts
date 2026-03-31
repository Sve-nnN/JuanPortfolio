/**
 * Fix test-sync-post author assignment via direct MongoDB update.
 * This is needed because the post has no Title/Content (corrupt test artifact),
 * which causes Payload's validation to reject the update.
 */
import { MongoClient, ObjectId } from 'mongodb'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const POST_ID = '69cb3d9e89ea376eed39802b'
const AUTHOR_ID = '68eebff77441f36b228ae938'

async function main() {
  const uri = process.env.DATABASE_URI
  if (!uri) throw new Error('DATABASE_URI not set')

  const client = new MongoClient(uri)
  await client.connect()

  try {
    const db = client.db()
    const posts = db.collection('posts')

    const result = await posts.updateOne(
      { _id: new ObjectId(POST_ID) },
      { $set: { authors: [new ObjectId(AUTHOR_ID)] } },
    )

    console.log('Matched:', result.matchedCount)
    console.log('Modified:', result.modifiedCount)

    // Verify
    const doc = await posts.findOne({ _id: new ObjectId(POST_ID) })
    console.log('authors after update:', JSON.stringify(doc?.authors))
  } finally {
    await client.close()
  }

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
