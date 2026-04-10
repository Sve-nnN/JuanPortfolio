import { getPayload } from 'payload'
import config from '../payload.config'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
})

const slugify = (s: string) =>
  String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

async function fixUserSlugs() {
  const payload = await getPayload({ config })

  console.log('Starting User Slug Backfill...')

  const users = await payload.find({
    collection: 'users',
    overrideAccess: true,
    where: {
      or: [
        {
          slug: {
            exists: false,
          },
        },
        {
          slug: {
            equals: '',
          },
        },
      ],
    },
    limit: 1000,
  })

  console.log(`Found ${users.totalDocs} users missing slugs.`)

  for (const user of users.docs) {
    if (!user.name) {
      console.warn(`User ${user.id} has no name, skipping.`)
      continue
    }

    const newSlug = slugify(user.name)
    console.log(`Updating user ${user.name} (${user.id}) with slug: ${newSlug}`)

    try {
      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          slug: newSlug,
        },
      })
      console.log(`✅ Updated ${user.name}`)
    } catch (error) {
      console.error(`❌ Failed to update ${user.name}:`, error)
    }
  }

  console.log('Done!')
  process.exit(0)
}

fixUserSlugs()
