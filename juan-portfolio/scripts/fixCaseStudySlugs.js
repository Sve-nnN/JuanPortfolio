;(async () => {
  try {
    const { MongoClient } = await import('mongodb')
    const uri = process.env.DATABASE_URI
    if (!uri) throw new Error('DATABASE_URI is not set')
    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db()
    const coll = db.collection('case-studies')

    const docs = await coll.find({ $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }] }).toArray()
    console.log(`Found ${docs.length} case-studies without slug`)

    const slugify = (s) =>
      String(s || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')

    for (const d of docs) {
      const newSlug = d.slug || (d.title ? slugify(d.title) : String(d._id))
      await coll.updateOne({ _id: d._id }, { $set: { slug: newSlug } })
      console.log(`Updated _id=${d._id} -> slug=${newSlug}`)
    }

    await client.close()
    console.log('Slug fix complete')
    process.exit(0)
  } catch (err) {
    console.error('Slug fix failed', err)
    process.exit(1)
  }
})()
