;(async () => {
  try {
    const { MongoClient } = await import('mongodb')
    const uri = process.env.DATABASE_URI
    if (!uri) throw new Error('DATABASE_URI is not set')
    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db()

    const worksColl = db.collection('works')
    const csColl = db.collection('case-studies')

    const works = await worksColl.find({}).toArray()
    console.log(`Found ${works.length} works to migrate`)

    for (const w of works) {
      const { _id, ...rest } = w
      const slugify = (s) =>
        String(s || '').toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')

      const newDoc = { ...rest }
      if (!newDoc.slug || newDoc.slug === '') {
        newDoc.slug = newDoc.title ? slugify(newDoc.title) : String(_id)
      }

      const res = await csColl.insertOne(newDoc)
      console.log(`Inserted case-studies _id=${res.insertedId} from work _id=${_id}`)
    }

    await client.close()
    console.log('Migration complete')
    process.exit(0)
  } catch (err) {
    console.error('Migration failed', err)
    process.exit(1)
  }
})()
