import { getPayload } from 'payload'
import config from './src/payload.config'

async function debug() {
  const payload = await getPayload({ config })
  
  const authorSlug = 'juan-carlos-angulo'
  const keyword = 'que es e-e-a-t seo'
  const categorySlug = 'seo'

  const author = await payload.find({
    collection: 'users',
    where: { slug: { equals: authorSlug } },
  })
  console.log(`Author '${authorSlug}':`, author.docs.length > 0 ? '✅ Found' : '❌ Not Found')

  const kw = await payload.find({
    collection: 'keyword-metrics',
    where: { keyword: { equals: keyword } },
  })
  console.log(`Keyword '${keyword}':`, kw.docs.length > 0 ? '✅ Found' : '❌ Not Found')

  const cat = await payload.find({
    collection: 'categories',
    where: { slug: { equals: categorySlug } },
  })
  console.log(`Category '${categorySlug}':`, cat.docs.length > 0 ? '✅ Found' : '❌ Not Found')

  process.exit(0)
}

debug()
