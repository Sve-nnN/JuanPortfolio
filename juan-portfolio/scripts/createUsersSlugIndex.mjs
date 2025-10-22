import { MongoClient } from 'mongodb'
// Run with: node -r dotenv/config scripts/createUsersSlugIndex.mjs

// Run as: node -r dotenv/config scripts/createUsersSlugIndex.mjs

(async () => {
  try {
    const uri = process.env.DATABASE_URI
    if (!uri) {
      console.error('DATABASE_URI not set')
      process.exit(2)
    }
    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db()
    const users = db.collection('users')

    // create unique index on slug for documents where slug exists
    // this is a partial index to avoid requiring slug for legacy docs
    const indexName = await users.createIndex({ slug: 1 }, { unique: true, partialFilterExpression: { slug: { $exists: true } } })
    console.log('Created index:', indexName)
    await client.close()
    process.exit(0)
  } catch (err) {
    console.error('Failed to create index', err)
    process.exit(1)
  }
})()
