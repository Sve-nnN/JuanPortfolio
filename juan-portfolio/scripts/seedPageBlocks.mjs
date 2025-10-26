import { MongoClient } from 'mongodb'
// Run with: node -r dotenv/config scripts/seedPageBlocks.mjs
;(async () => {
  try {
    const uri = process.env.DATABASE_URI
    if (!uri) {
      console.error('DATABASE_URI not set')
      process.exit(2)
    }
    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db()

    console.log('🌱 Starting page and global seeding...\n')

    const pages = db.collection('pages')
    const caseStudies = db.collection('case-studies')
    const clients = db.collection('clients')
    const posts = db.collection('posts')
    const globals = db.collection('globals')

    // CLEANUP: Remove corrupted pages
    console.log('🧹 Cleaning up corrupted pages...')
    const deleteResult = await pages.deleteOne({ slug: undefined })
    if (deleteResult.deletedCount > 0) {
      console.log('✅ Removed corrupted page\n')
    }

    const csData = await caseStudies.find({}).limit(6).toArray()
    const clientsData = await clients.find({}).limit(10).toArray()
    const postsData = await posts.find({}).limit(3).toArray()

    console.log(
      `Found ${csData.length} case studies, ${clientsData.length} clients, ${postsData.length} posts\n`,
    )

    // Helper: upsert by slug with all required Payload fields
    const upsertPage = async (slug, doc) => {
      const existing = await pages.findOne({ slug })
      const now = new Date().toISOString()

      // Build complete document with all Payload required fields
      const fullDoc = {
        ...doc,
        slug,
        _status: 'published',
        publishedAt: now, // REQUIRED for Payload admin
        updatedAt: now,
        __v: 0, // REQUIRED for Mongoose/Payload
      }

      if (existing) {
        await pages.updateOne({ slug }, { $set: fullDoc })
        console.log('✅', slug, 'page updated')
      } else {
        fullDoc.createdAt = now
        await pages.insertOne(fullDoc)
        console.log('✅', slug, 'page created')
      }
    }

    // BLOG LISTING GLOBAL
    console.log('📝 Blog Listing global...')
    const blogGlobal = await globals.findOne({ globalType: 'blog-listing' })
    const blogLayout = [
      {
        blockType: 'listingHero',
        blockName: 'Blog Hero',
        title: 'Blog',
        description: 'Insights, tutorials, and stories from our team',
        breadcrumbs: [
          { label: 'Home', url: '/' },
          { label: 'Blog', url: '/blog' },
        ],
      },
      {
        blockType: 'postsGrid',
        blockName: 'Blog Posts Grid',
        postsPerPage: 12,
        showCategories: true,
        gridColumns: 3,
        showExcerpt: true,
        showDate: true,
      },
    ]
    if (blogGlobal) {
      await globals.updateOne(
        { globalType: 'blog-listing' },
        { $set: { layout: blogLayout, updatedAt: new Date().toISOString() } },
      )
      console.log('✅ Blog global updated\n')
    } else {
      await globals.insertOne({
        globalType: 'blog-listing',
        layout: blogLayout,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      console.log('✅ Blog global created\n')
    }

    // CASE STUDIES LISTING GLOBAL
    console.log('📂 Case Studies Listing global...')
    const csGlobal = await globals.findOne({ globalType: 'case-studies-listing' })
    const csLayout = [
      {
        blockType: 'listingHero',
        blockName: 'Case Studies Hero',
        title: 'Case Studies',
        description: 'Explore our featured projects and success stories',
        breadcrumbs: [
          { label: 'Home', url: '/' },
          { label: 'Case Studies', url: '/case-studies' },
        ],
      },
      {
        blockType: 'caseStudiesGrid',
        blockName: 'Case Studies Grid',
        itemsPerPage: 9,
        gridColumns: 3,
      },
    ]
    if (csGlobal) {
      await globals.updateOne(
        { globalType: 'case-studies-listing' },
        { $set: { layout: csLayout, updatedAt: new Date().toISOString() } },
      )
      console.log('✅ CS global updated\n')
    } else {
      await globals.insertOne({
        globalType: 'case-studies-listing',
        layout: csLayout,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      console.log('✅ CS global created\n')
    }

    // HOME PAGE
    console.log('🏠 Home page...')
    const homeLayout = [
      {
        blockType: 'heroHome',
        blockName: 'Hero Home',
        title: 'Building Digital Excellence',
        description: 'We create innovative web solutions that drive business growth',
        primaryCTA: { text: 'View Our Work', url: '/case-studies' },
        secondaryCTA: { text: 'Get In Touch', url: '/contact' },
        images: [{ alt: 'Hero Image 1' }],
      },
      {
        blockType: 'aboutSection',
        blockName: 'About Section',
        tagline: 'About Us',
        title: 'We Are Digital Innovators',
        description:
          'With years of experience in web development, we help businesses transform their digital presence.',
        stats: [
          { number: '150+', label: 'Projects Completed' },
          { number: '50+', label: 'Happy Clients' },
          { number: '8+', label: 'Years Experience' },
        ],
      },
      {
        blockType: 'featuredWorks',
        blockName: 'Featured Case Studies',
        sectionTitle: 'Featured Projects',
        sectionDescription: 'Check out some of our recent work',
        works: csData.slice(0, 6).map((c) => ({ relationTo: 'case-studies', value: c._id })),
        ctaText: 'View All Projects',
        ctaUrl: '/case-studies',
      },
      {
        blockType: 'featuredClients',
        blockName: 'Featured Clients',
        sectionTitle: 'Trusted By Industry Leaders',
        sectionDescription: 'We work with amazing companies',
        clients: clientsData.slice(0, 8).map((c) => ({ relationTo: 'clients', value: c._id })),
      },
      {
        blockType: 'featuredBlog',
        blockName: 'Latest Blog Posts',
        sectionTitle: 'Latest Insights',
        sectionDescription: 'Read our latest articles and tutorials',
        posts: postsData.slice(0, 3).map((p) => ({ relationTo: 'posts', value: p._id })),
        ctaText: 'View All Posts',
        ctaUrl: '/blog',
      },
      {
        blockType: 'contactForm',
        blockName: 'Contact Form',
        title: "Let's Work Together",
        description: 'Get in touch to discuss your next project',
        form: null,
      },
      {
        blockType: 'simpleCta',
        blockName: 'Simple CTA',
        text: 'Ready to start your project?',
        ctaLabel: 'Get Started',
        ctaUrl: '/contact',
        backgroundColor: 'primary',
      },
    ]
    await upsertPage('home', {
      title: { en: 'Home', es: 'Inicio' },
      hero: { type: 'lowImpact', links: [] },
      meta: {},
      generateSlug: false,
      layout: homeLayout,
    })

    // BLOG PAGE
    console.log('📝 Blog page...')
    const blogPageLayout = [
      {
        blockType: 'listingHero',
        blockName: 'Blog Hero',
        title: 'Blog',
        description: 'Insights, tutorials, and stories from our team',
        breadcrumbs: [
          { label: 'Home', url: '/' },
          { label: 'Blog', url: '/blog' },
        ],
      },
      {
        blockType: 'postsGrid',
        blockName: 'Blog Posts Grid',
        postsPerPage: 12,
        showCategories: true,
        gridColumns: 3,
        showExcerpt: true,
        showDate: true,
      },
    ]
    await upsertPage('blog', {
      title: { en: 'Blog', es: 'Blog' },
      hero: { type: 'lowImpact', links: [] },
      meta: {},
      generateSlug: false,
      layout: blogPageLayout,
    })

    // CASE STUDIES PAGE
    console.log('📂 Case Studies page...')
    const csPageLayout = [
      {
        blockType: 'listingHero',
        blockName: 'Case Studies Hero',
        title: 'Case Studies',
        description: 'Explore our featured projects and success stories',
        breadcrumbs: [
          { label: 'Home', url: '/' },
          { label: 'Case Studies', url: '/case-studies' },
        ],
      },
      {
        blockType: 'caseStudiesGrid',
        blockName: 'Case Studies Grid',
        itemsPerPage: 9,
        gridColumns: 3,
      },
    ]
    await upsertPage('case-studies', {
      title: { en: 'Case Studies', es: 'Casos de Estudio' },
      hero: { type: 'lowImpact', links: [] },
      meta: {},
      generateSlug: false,
      layout: csPageLayout,
    })

    console.log('\n✨ Done! Go to http://localhost:3002/admin → Collections → Pages\n')
    await client.close()
    process.exit(0)
  } catch (err) {
    console.error('❌ Error:', err)
    process.exit(1)
  }
})()
