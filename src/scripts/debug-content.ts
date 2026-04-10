import { getPayload } from 'payload'
import configPromise from '@payload-config'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({ path: path.resolve(dirname, '../../.env') })

async function debugContent() {
    try {
        const payload = await getPayload({ config: configPromise })

        console.log('--- Debugging Content Availability ---')

        // Check Pages
        console.log('\n--- PAGES ---')
        const allPages = await payload.find({ collection: 'pages', limit: 10, draft: true })
        console.log(`Total Pages found: ${allPages.totalDocs}`)
        allPages.docs.forEach((d) => console.log(` - "${d.title}" (Status: ${d._status})`))

        // Check Posts
        console.log('\n--- POSTS ---')
        const allPosts = await payload.find({ collection: 'posts', limit: 10, draft: true })
        console.log(`Total Posts found: ${allPosts.totalDocs}`)
        allPosts.docs.forEach((d) => console.log(` - "${d.title}" (Status: ${d._status})`))

        // Check Case Studies
        console.log('\n--- CASE STUDIES ---')
        const allCaseStudies = await payload.find({ collection: 'case-studies', limit: 10, draft: true })
        console.log(`Total Case Studies found: ${allCaseStudies.totalDocs}`)
        allCaseStudies.docs.forEach((d) => console.log(` - "${d.title}" (Status: ${d._status})`))

        console.log('--------------------------------------')
        process.exit(0)
    } catch (error) {
        console.error('Error debugging content:', error)
        process.exit(1)
    }
}

debugContent()
