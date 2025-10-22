(async () => {
  try {
  // Import the TS payload config directly (requires running with ts-node/register)
  const config = (await import('../src/payload.config.ts')).default
  const { getPayload } = await import('payload')
  const payload = await getPayload({ config })

    // Create sample media (skip if not available)
    // Create a sample user
    const user = await payload.create({
      collection: 'users',
      data: {
        name: 'Autor de prueba',
        role: 'Desarrollador Senior',
        bio: 'Creador de contenido y desarrollador con experiencia en proyectos web.',
        slug: 'autor-de-prueba',
        experience: [
          { company: 'Empresa A', role: 'Senior Dev', startDate: '2018-01-01', endDate: '2020-12-31', description: 'Trabajé en frontend y backend.' },
        ],
      },
    })

    console.log('Created user', user.id)

    // Create sample case studies
    const cs1 = await payload.create({
      collection: 'case-studies',
      data: {
        title: 'Caso de estudio de ejemplo 1',
        excerpt: 'Resumen del caso 1',
      },
    })
    const cs2 = await payload.create({
      collection: 'case-studies',
      data: {
        title: 'Caso de estudio de ejemplo 2',
        excerpt: 'Resumen del caso 2',
      },
    })

    console.log('Created case studies', cs1.id, cs2.id)

    // Create sample posts linked to user
    const post = await payload.create({
      collection: 'posts',
      data: {
        title: 'Post de prueba por Autor',
        content: {
          root: { type: 'root', version: 1, children: [{ type: 'paragraph', children: [{ text: 'Contenido de prueba' }] }] },
        },
        authors: [user.id],
        publishedAt: new Date().toISOString(),
        slug: 'post-autor-prueba'
      },
    })

    console.log('Created post', post.id)
    // Create basic pages (idempotent - check by slug)
    const ensurePage = async (slug, data) => {
      const existing = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1 })
      if (existing && existing.totalDocs > 0) return existing.docs[0]
      const created = await payload.create({ collection: 'pages', data })
      return created
    }

    const homePage = await ensurePage('home', {
      title: 'Home',
      slug: 'home',
      _status: 'published',
      hero: {
        type: 'highImpact',
        richText: { root: { type: 'root', version: 1, children: [{ type: 'paragraph', children: [{ text: 'Bienvenido' }] }] } },
      },
      layout: [
        {
          blockType: 'content',
          columns: [
            { size: 'full', richText: { root: { type: 'root', version: 1, children: [{ type: 'paragraph', children: [{ text: 'Home intro' }] }] } } },
          ],
        },
      ],
    })

    const blogPage = await ensurePage('blog', {
      title: 'Blog',
      slug: 'blog',
      _status: 'published',
      hero: { type: 'lowImpact' },
      layout: [
        { blockType: 'archive' },
      ],
    })

    const csList = await ensurePage('case-studies', {
      title: 'Case Studies',
      slug: 'case-studies',
      _status: 'published',
      hero: { type: 'lowImpact' },
      layout: [
        { blockType: 'workCards' },
      ],
    })

    // create an example case-study if none exists
    const csExisting = await payload.find({ collection: 'case-studies', limit: 1 })
    if (!csExisting || csExisting.totalDocs === 0) {
      await payload.create({ collection: 'case-studies', data: { title: 'Ejemplo Case Study', slug: 'ejemplo-case-study', excerpt: 'Ejemplo', _status: 'published' } })
    }

    console.log('Seeding complete - pages created/verified')
    process.exit(0)
  } catch (err) {
    console.error('Seeding failed', err)
    process.exit(1)
  }
})()
