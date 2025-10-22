import config from '../src/payload.config'
import { getPayload } from 'payload'

async function migrate() {
  try {
    const payload = await getPayload({ config })

    const works = await payload.find({ collection: 'works', pagination: false })
    console.log(`Found ${works.totalDocs} works to migrate`)

    for (const w of works.docs || []) {
      // Map fields directly; adjust if your documents have more fields
      const payloadData: any = {
        title: w.title,
        excerpt: w.excerpt,
        cover: w.cover && w.cover.id ? w.cover.id : w.cover,
        tags: w.tags,
        caseStudyUrl: w.caseStudyUrl,
      }

      // Create document in case-studies collection
      const created = await payload.create({ collection: 'case-studies', data: payloadData })
      console.log(`Created case-study ${created.id} from work ${w.id}`)
    }

    console.log('Migration complete')
  } catch (err) {
    console.error('Migration failed', err)
    process.exit(1)
  }
}

migrate()
