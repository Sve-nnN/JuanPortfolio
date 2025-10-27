/**
 * Seed script usando Payload API (no MongoDB directo)
 * Ejecutar con: node --loader tsx scripts/seedPageBlocksWithPayload.ts
 */

import { getPayload } from 'payload'
import config from '../src/payload.config'
import type { Payload } from 'payload'

async function seedPagesWithPayload() {
  console.log('🌱 Iniciando seed de páginas con Payload API...\n')

  let payload: Payload

  try {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    console.log('✅ Payload inicializado\n')

    // 1. Limpiar páginas viejas/problemáticas
    console.log('🧹 Limpiando páginas problemáticas...')
    const existingPages = await payload.find({
      collection: 'pages',
      limit: 100,
    })

    for (const page of existingPages.docs) {
      // Eliminar páginas de prueba o sin slug apropiado
      if (
        !page.slug ||
        page.slug.includes('integration-page') ||
        page.slug.includes('testing-page') ||
        page.slug === 'undefined'
      ) {
        await payload.delete({
          collection: 'pages',
          id: page.id,
        })
        console.log(`   ❌ Eliminada página: ${page.slug || '<sin slug>'}`)
      }
    }
    console.log('✅ Limpieza completada\n')

    // 2. Obtener datos para poblar bloques
    const caseStudies = await payload.find({
      collection: 'case-studies',
      limit: 6,
    })

    const clients = await payload.find({
      collection: 'clients',
      limit: 10,
    })

    const posts = await payload.find({
      collection: 'posts',
      limit: 3,
    })

    console.log(
      `📊 Datos encontrados: ${caseStudies.docs.length} case studies, ${clients.docs.length} clients, ${posts.docs.length} posts\n`,
    )

    // 3. Función helper para crear o actualizar página
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function upsertPage(slug: string, data: any) {
      // Buscar si existe
      const existing = await payload.find({
        collection: 'pages',
        where: { slug: { equals: slug } },
        limit: 1,
      })

      if (existing.totalDocs > 0) {
        // Actualizar
        const updated = await payload.update({
          collection: 'pages',
          id: existing.docs[0].id,
          data: {
            ...data,
            slug,
            _status: 'published',
          },
        })
        console.log(`   ✅ ${slug} page updated`)
        return updated
      } else {
        // Crear nueva
        const created = await payload.create({
          collection: 'pages',
          data: {
            ...data,
            slug,
            _status: 'published',
          },
        })
        console.log(`   ✅ ${slug} page created`)
        return created
      }
    }

    // 4. PÁGINA HOME
    console.log('📄 Creando/actualizando página HOME...')
    await upsertPage('home', {
      title: {
        en: 'Home',
        es: 'Inicio',
      },
      hero: {
        type: 'home',
      },
      meta: {
        title: {
          en: 'Home - Portfolio',
          es: 'Inicio - Portafolio',
        },
        description: {
          en: 'Welcome to my portfolio',
          es: 'Bienvenido a mi portafolio',
        },
      },
      layout: {
        en: [
          {
            blockType: 'heroHome',
            blockName: 'Home Hero',
            heading: 'Welcome to My Portfolio',
            description: 'Discover my work and expertise',
          },
          {
            blockType: 'aboutSection',
            blockName: 'About Me',
            heading: 'About Me',
            description: 'Learn more about my background and skills',
          },
          {
            blockType: 'featuredWorks',
            blockName: 'Featured Works',
            heading: 'Featured Projects',
            caseStudies: caseStudies.docs.slice(0, 3).map((cs) => cs.id),
          },
          {
            blockType: 'featuredClients',
            blockName: 'Our Clients',
            heading: 'Trusted By',
            clients: clients.docs.map((c) => c.id),
          },
          {
            blockType: 'featuredBlog',
            blockName: 'Latest Posts',
            heading: 'From the Blog',
            posts: posts.docs.map((p) => p.id),
          },
          {
            blockType: 'contactForm',
            blockName: 'Contact Form',
            heading: 'Get In Touch',
          },
          {
            blockType: 'simpleCta',
            blockName: 'CTA',
            heading: 'Ready to Start?',
            description: "Let's work together",
          },
        ],
        es: [
          {
            blockType: 'heroHome',
            blockName: 'Hero Principal',
            heading: 'Bienvenido a Mi Portafolio',
            description: 'Descubre mi trabajo y experiencia',
          },
          {
            blockType: 'aboutSection',
            blockName: 'Acerca de Mí',
            heading: 'Acerca de Mí',
            description: 'Conoce más sobre mi experiencia y habilidades',
          },
          {
            blockType: 'featuredWorks',
            blockName: 'Trabajos Destacados',
            heading: 'Proyectos Destacados',
            caseStudies: caseStudies.docs.slice(0, 3).map((cs) => cs.id),
          },
          {
            blockType: 'featuredClients',
            blockName: 'Nuestros Clientes',
            heading: 'Confían en Nosotros',
            clients: clients.docs.map((c) => c.id),
          },
          {
            blockType: 'featuredBlog',
            blockName: 'Últimas Entradas',
            heading: 'Del Blog',
            posts: posts.docs.map((p) => p.id),
          },
          {
            blockType: 'contactForm',
            blockName: 'Formulario de Contacto',
            heading: 'Contáctanos',
          },
          {
            blockType: 'simpleCta',
            blockName: 'CTA',
            heading: '¿Listo para Comenzar?',
            description: 'Trabajemos juntos',
          },
        ],
      },
    })

    // 5. PÁGINA BLOG
    console.log('📄 Creando/actualizando página BLOG...')
    await upsertPage('blog', {
      title: {
        en: 'Blog',
        es: 'Blog',
      },
      hero: {
        type: 'lowImpact',
      },
      meta: {
        title: {
          en: 'Blog - Latest Articles',
          es: 'Blog - Últimos Artículos',
        },
        description: {
          en: 'Read our latest articles and insights',
          es: 'Lee nuestros últimos artículos y conocimientos',
        },
      },
      layout: {
        en: [
          {
            blockType: 'listingHero',
            blockName: 'Blog Hero',
            heading: 'Blog',
            description: 'Latest articles and insights',
          },
          {
            blockType: 'postsGrid',
            blockName: 'Posts Grid',
          },
        ],
        es: [
          {
            blockType: 'listingHero',
            blockName: 'Hero del Blog',
            heading: 'Blog',
            description: 'Últimos artículos y conocimientos',
          },
          {
            blockType: 'postsGrid',
            blockName: 'Grid de Posts',
          },
        ],
      },
    })

    // 6. PÁGINA CASE STUDIES
    console.log('📄 Creando/actualizando página CASE STUDIES...')
    await upsertPage('case-studies', {
      title: {
        en: 'Case Studies',
        es: 'Casos de Estudio',
      },
      hero: {
        type: 'lowImpact',
      },
      meta: {
        title: {
          en: 'Case Studies - Our Work',
          es: 'Casos de Estudio - Nuestro Trabajo',
        },
        description: {
          en: 'Explore our portfolio of successful projects',
          es: 'Explora nuestro portafolio de proyectos exitosos',
        },
      },
      layout: {
        en: [
          {
            blockType: 'listingHero',
            blockName: 'Case Studies Hero',
            heading: 'Case Studies',
            description: 'Our successful projects',
          },
          {
            blockType: 'caseStudiesGrid',
            blockName: 'Case Studies Grid',
          },
        ],
        es: [
          {
            blockType: 'listingHero',
            blockName: 'Hero de Casos',
            heading: 'Casos de Estudio',
            description: 'Nuestros proyectos exitosos',
          },
          {
            blockType: 'caseStudiesGrid',
            blockName: 'Grid de Casos',
          },
        ],
      },
    })

    // 7. Actualizar globals
    console.log('\n📄 Actualizando globals...')

    // Blog listing global
    await payload.updateGlobal({
      slug: 'blog-listing',
      data: {
        layout: [
          {
            blockType: 'listingHero',
            blockName: 'Blog Hero',
            heading: 'Blog',
            description: 'Latest articles',
          },
          {
            blockType: 'postsGrid',
            blockName: 'Posts Grid',
          },
        ],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    })
    console.log('   ✅ Blog global updated')

    // Case studies listing global
    await payload.updateGlobal({
      slug: 'case-studies-listing',
      data: {
        layout: [
          {
            blockType: 'listingHero',
            blockName: 'CS Hero',
            heading: 'Case Studies',
            description: 'Our work',
          },
          {
            blockType: 'caseStudiesGrid',
            blockName: 'CS Grid',
          },
        ],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    })
    console.log('   ✅ Case Studies global updated')

    console.log('\n✨ ¡Seed completado exitosamente!')
    console.log('\n🌐 Abre el admin en: http://localhost:3000/admin/collections/pages')
    console.log('   (o http://localhost:3002/admin si 3000 está ocupado)\n')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

seedPagesWithPayload()
