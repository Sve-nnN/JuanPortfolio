import { getPayload } from 'payload'
import config from '../src/payload.config'

async function run() {
    console.log('Starting deletePosts script...')
    try {
        const payload = await getPayload({ config })
        console.log('Payload initialized.')

        const posts = await payload.find({
            collection: 'posts',
            limit: 100,
            depth: 0,
        })

        console.log(`Found ${posts.docs.length} posts to delete.`)

        for (const post of posts.docs) {
            console.log(`Deleting post: "${post.title}" (ID: ${post.id})...`)
            await payload.delete({
                collection: 'posts',
                id: post.id,
            })
        }

        console.log('Cleanup complete.')
    } catch (error) {
        console.error('Error during cleanup:', error)
    }
    process.exit(0)
}

run()
