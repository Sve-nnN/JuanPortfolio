/**
 * Phase 4 — Author Profile & E-E-A-T
 * Script: update-author-profile.ts
 *
 * Step 1: Find the Juan Carlos Angulo user record and update bio, jobTitle, socialMedia
 * Step 2: Audit all published posts and bulk-assign the author to any missing authors
 *
 * Usage: npx tsx src/scripts/update-author-profile.ts
 */

import { getPayload } from 'payload'
import config from '../payload.config'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
})

const ES_BIO = `Soy Juan Carlos Angulo, Ingeniero de Software y Consultor SEO Técnico freelance con sede en Lima, Perú. A lo largo de más de cuatro años de experiencia profesional me he especializado en la intersección entre el desarrollo de software y la optimización para motores de búsqueda.

Mi trabajo combina la auditoría técnica SEO —rastreo, indexabilidad, Core Web Vitals, Schema.org y datos estructurados— con el desarrollo full-stack utilizando Next.js y Payload CMS. Ayudo a empresas a mejorar su visibilidad orgánica mediante correcciones a nivel de código, sin intermediarios. Construyo y mantengo juan-tech.com, un blog técnico bilingüe orientado a desarrolladores y profesionales de tecnología en Latinoamérica y España.`

const EN_BIO = `I'm Juan Carlos Angulo, a Software Engineer and Technical SEO Consultant based in Lima, Peru, with over four years of professional experience. I build web applications with Next.js and Payload CMS, conduct technical SEO audits (crawlability, Core Web Vitals, Schema.org, indexation), and help businesses grow their organic visibility by fixing issues at the source. I run juan-tech.com, a bilingual technical blog in Spanish and English covering Technical SEO, web performance, and CS fundamentals for developers across Latin America and Spain.`

async function main() {
  const payload = await getPayload({ config })

  // ── Step 1: Find the Juan Carlos Angulo user record ──────────────────────────
  console.log('\n[Step 1] Finding Juan Carlos Angulo user record...')

  const usersResult = await payload.find({
    collection: 'users',
    overrideAccess: true,
    where: {
      or: [
        { slug: { equals: 'juan-carlos-angulo' } },
        { name: { like: 'Juan Carlos' } },
      ],
    },
    limit: 5,
    depth: 0,
  })

  console.log(`Found ${usersResult.totalDocs} matching user(s).`)

  if (usersResult.totalDocs === 0) {
    console.error('ERROR: No user found for Juan Carlos Angulo. Aborting.')
    process.exit(1)
  }

  const user = usersResult.docs[0]
  const userId = user.id
  console.log(`User ID: ${userId}`)
  console.log(`Name: ${user.name}`)
  console.log(`Slug: ${user.slug}`)
  console.log(`Email: ${user.email}`)

  // ── Step 2: Update the user record ───────────────────────────────────────────
  console.log('\n[Step 2] Updating user record (bio, jobTitle, socialMedia)...')

  await payload.update({
    collection: 'users',
    id: userId,
    overrideAccess: true,
    locale: 'es',
    data: {
      name: 'Juan Carlos Angulo',
      jobTitle: 'Ingeniero de Software y Consultor SEO Técnico',
      bio: ES_BIO,
      socialMedia: {
        linkedin: 'https://www.linkedin.com/in/juancangulo/',
        // Canonical GitHub casing, consistent with the Person/Organization
        // sameAs (github.com/Sve-nnN). SEO audit jun-2026, issue #52.
        github: 'https://github.com/Sve-nnN',
        website: 'https://juan-tech.com',
      },
    },
  })

  // Update EN locale separately
  await payload.update({
    collection: 'users',
    id: userId,
    overrideAccess: true,
    locale: 'en',
    data: {
      jobTitle: 'Software Engineer & Technical SEO Consultant',
      bio: EN_BIO,
    },
  })

  console.log('User record updated successfully.')

  // ── Step 3: Verify update ─────────────────────────────────────────────────────
  console.log('\n[Step 3] Verifying update...')

  const updatedUser = await payload.findByID({
    collection: 'users',
    id: userId,
    overrideAccess: true,
    locale: 'es',
    depth: 0,
  })

  console.log(`bio (ES) length: ${((updatedUser.bio as string) || '').length} chars`)
  console.log(`jobTitle (ES): ${updatedUser.jobTitle}`)
  console.log(`socialMedia.linkedin: ${(updatedUser.socialMedia as Record<string, string>)?.linkedin}`)
  console.log(`socialMedia.github: ${(updatedUser.socialMedia as Record<string, string>)?.github}`)

  // ── Step 4: Audit published posts for missing authors ─────────────────────────
  console.log('\n[Step 4] Auditing published posts for missing authors...')

  // Get total published posts
  const allPublished = await payload.find({
    collection: 'posts',
    overrideAccess: true,
    where: { _status: { equals: 'published' } },
    limit: 0,
    depth: 0,
  })
  const totalPublished = allPublished.totalDocs
  console.log(`Total published posts: ${totalPublished}`)

  // Get published posts with no authors (fetch all with pagination)
  const postsToAudit: Array<{ id: string; slug: string; title: string }> = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const batch = await payload.find({
      collection: 'posts',
      overrideAccess: true,
      where: { _status: { equals: 'published' } },
      limit: 50,
      page,
      depth: 1,
    })

    for (const post of batch.docs) {
      const authors = post.authors
      const hasAuthor = Array.isArray(authors) && authors.length > 0
      if (!hasAuthor) {
        postsToAudit.push({
          id: String(post.id),
          slug: String(post.slug || ''),
          title: String(post.title || post.id),
        })
      }
    }

    hasMore = batch.hasNextPage
    page += 1
  }

  const missingBefore = postsToAudit.length
  console.log(`Posts missing author (before): ${missingBefore}`)

  if (postsToAudit.length > 0) {
    console.log('\nPosts to patch:')
    for (const p of postsToAudit) {
      console.log(`  - ${p.slug || p.id}`)
    }
  }

  // ── Step 5: Bulk-assign author ────────────────────────────────────────────────
  console.log(`\n[Step 5] Bulk-assigning author ${userId} to ${missingBefore} posts...`)

  const patchedSlugs: string[] = []
  let patchErrors = 0

  for (const post of postsToAudit) {
    try {
      await payload.update({
        collection: 'posts',
        id: post.id,
        overrideAccess: true,
        context: { disableRevalidate: true },
        data: {
          authors: [userId],
        },
      })
      patchedSlugs.push(post.slug || post.id)
      console.log(`  Patched: ${post.slug || post.id}`)
    } catch (err) {
      console.error(`  ERROR patching ${post.slug || post.id}:`, err)
      patchErrors += 1
    }
  }

  // ── Step 6: Verify zero missing after ────────────────────────────────────────
  console.log('\n[Step 6] Verifying zero posts missing author after patch...')

  let stillMissing = 0
  page = 1
  hasMore = true

  while (hasMore) {
    const batch = await payload.find({
      collection: 'posts',
      overrideAccess: true,
      where: { _status: { equals: 'published' } },
      limit: 50,
      page,
      depth: 1,
    })

    for (const post of batch.docs) {
      const authors = post.authors
      const hasAuthor = Array.isArray(authors) && authors.length > 0
      if (!hasAuthor) stillMissing += 1
    }

    hasMore = batch.hasNextPage
    page += 1
  }

  console.log(`Posts missing author (after): ${stillMissing}`)

  // ── Output summary JSON ───────────────────────────────────────────────────────
  const result = {
    userId,
    userName: 'Juan Carlos Angulo',
    userSlug: user.slug || 'juan-carlos-angulo',
    bioEsLength: ((updatedUser.bio as string) || '').length,
    jobTitleEs: updatedUser.jobTitle,
    socialMedia: (updatedUser.socialMedia as Record<string, string>) || {},
    totalPublishedPosts: totalPublished,
    missingAuthorBefore: missingBefore,
    patched: patchedSlugs.length,
    patchErrors,
    missingAuthorAfter: stillMissing,
    patchedSlugs,
  }

  console.log('\n──────────────────────────────────────────')
  console.log('RESULT JSON:')
  console.log(JSON.stringify(result, null, 2))
  console.log('──────────────────────────────────────────')

  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
