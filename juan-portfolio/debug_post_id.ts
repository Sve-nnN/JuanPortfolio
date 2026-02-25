import { getPayload } from 'payload'
import config from './src/payload.config'

async function debug() {
  const payload = await getPayload({ config })
  
  const postId = '698f8760b4bf904c846a0254'

  try {
    const post = await payload.findByID({
      collection: 'posts',
      id: postId,
    })
    console.log(`Post ID '${postId}': ✅ Found`)
  } catch (e) {
    console.log(`Post ID '${postId}': ❌ Not Found in Payload`)
  }

  process.exit(0)
}

debug()
