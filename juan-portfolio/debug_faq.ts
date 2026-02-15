import 'dotenv/config'
import { getPayload } from 'payload'
import config from './src/payload.config'

async function debug() {
  const payload = await getPayload({ config })
  const posts = await payload.find({
    collection: 'posts',
    where: { slug: { equals: 'algoritmos-estructuras-datos' } },
    limit: 1,
    locale: 'es'
  })

  if (posts.docs.length > 0) {
    const post = posts.docs[0]
    console.log('--- CONTENT NODES ---')
    const children = (post.content?.content as any)?.root?.children || []
    children.forEach((node: any, i: number) => {
      console.log(`[${i}] Type: ${node.type} | Tag: ${node.tag || ''} | BlockType: ${node.fields?.blockType || ''}`)
      if (node.type === 'heading') {
        console.log(`    Text: ${node.children?.[0]?.text}`)
      }
      if (node.fields?.blockType === 'faq') {
        console.log(`    Title: ${node.fields.title}`)
        node.fields.faqs.forEach((f: any) => console.log(`    - Q: ${f.question}`))
      }
    })
  } else {
    console.log('Post not found')
  }
  process.exit(0)
}

debug()
