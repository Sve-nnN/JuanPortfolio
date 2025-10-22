(async () => {
  try {
    const { MongoClient, ObjectId } = require('mongodb')
    require('dotenv').config()
    const uri = process.env.DATABASE_URI
    if (!uri) {
      console.error('DATABASE_URI not set')
      process.exit(2)
    }
    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db()

    const pages = db.collection('pages')
    const cs = db.collection('case-studies')

    // helper: upsert by slug
    const upsertPage = async (slug, doc) => {
      const existing = await pages.findOne({ slug })
      if (existing) {
        console.log('page exists', slug)
        return existing
      }
      const now = new Date()
      const toInsert = Object.assign({ createdAt: now.toISOString(), updatedAt: now.toISOString() }, doc)
      const res = await pages.insertOne(toInsert)
      console.log('inserted page', slug, res.insertedId)
      return toInsert
    }

    await upsertPage('home', {
      title: 'Home',
      slug: 'home',
      _status: 'published',
      hero: {
        type: 'highImpact',
        richText: { root: { type: 'root', version: 1, children: [{ type: 'paragraph', children: [{ text: 'Bienvenido' }] }] } },
      },
      layout: [
        {
          blockType: 'content',
          blockName: 'Content Block',
          columns: [
            { size: 'full', richText: { root: { type: 'root', version: 1, children: [{ type: 'paragraph', children: [{ text: 'Home intro' }] }] } } },
          ],
        },
      ],
    })

    await upsertPage('blog', {
      title: 'Blog',
      slug: 'blog',
      _status: 'published',
      hero: { type: 'lowImpact' },
      layout: [ { blockType: 'archive', blockName: 'Archive Block' } ],
    })

    await upsertPage('case-studies', {
      title: 'Case Studies',
      slug: 'case-studies',
      _status: 'published',
      hero: { type: 'lowImpact' },
      layout: [ { blockType: 'workCards', blockName: 'Work Cards' } ],
    })

    // upsert example case-study
    const csExisting = await cs.findOne({ slug: 'ejemplo-case-study' })
    if (!csExisting) {
      const now = new Date()
      const doc = { title: 'Ejemplo Case Study', slug: 'ejemplo-case-study', excerpt: 'Ejemplo', _status: 'published', createdAt: now.toISOString(), updatedAt: now.toISOString() }
      const res = await cs.insertOne(doc)
      console.log('inserted case-study', res.insertedId)
    } else {
      console.log('case-study exists', csExisting.slug)
    }

    await client.close()
    console.log('seedPagesWithMongo complete')
    process.exit(0)
  } catch (err) {
    console.error('Seeding failed', err)
    process.exit(1)
  }
})()
