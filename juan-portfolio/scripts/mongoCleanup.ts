import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

const uri = process.env.DATABASE_URI

async function cleanup() {
    if (!uri) {
        console.error('DATABASE_URI not found in .env')
        process.exit(1)
    }

    const client = new MongoClient(uri)

    console.log('Connecting to MongoDB Atlas...')
    try {
        await client.connect()
        console.log('Connected.')

        const db = client.db()
        const collection = db.collection('posts')

        console.log('Fetching posts...')
        const posts = await collection.find({}).toArray()
        console.log(`Found ${posts.length} posts.`)

        for (const post of posts) {
            console.log(`Deleting post: "${post.title}" (ID: ${post._id})...`)
            await collection.deleteOne({ _id: post._id })
        }

        console.log('Cleanup complete.')
    } catch (err) {
        console.error('Error:', err)
    } finally {
        await client.close()
        process.exit(0)
    }
}

cleanup()
