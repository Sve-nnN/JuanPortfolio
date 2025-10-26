/**
 * Seed simplificado - crea páginas con estructura correcta directamente
 * Basado en el test de integración que SÍ funciona
 */

import { getPayload } from 'payload'
import config from '../src/payload.config.js'

const seed = async () => {
  console.log('🌱 Seeding pages with Payload API...\n')

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  console.log('✅ Payload connected\n')

  // Helper para crear/actualizar página
  const upsertPage = async (slug, data) => {
    try {
      // Buscar si existe
      const existing = await payload.find({
        collection: 'pages',
        where: { slug: { equals: slug } },
        limit: 1,
      })

      if (existing.totalDocs > 0) {
        console.log(`📝 Updating ${slug}...`)
        await payload.update({
          collection: 'pages',
          id: existing.docs[0].id,
          data: { ...data, _status: 'published' },
        })
        console.log(`   ✅ Updated\n`)
      } else {
        console.log(`📄 Creating ${slug}...`)
        await payload.create({
          collection: 'pages',
          data: { ...data, slug, _status: 'published' },
        })
        console.log(`   ✅ Created\n`)
      }
    } catch (error) {
      console.error(`   ❌ Error with ${slug}:`, error.message)
    }
  }

  // HOME PAGE
  await upsertPage('home', {
    title: {
      en: 'Home',
      es: 'Inicio',
    },
    hero: { type: 'home' },
    layout: {
      en: [
        { blockType: 'heroHome', blockName: 'Hero', heading: 'Welcome' },
        { blockType: 'aboutSection', blockName: 'About', heading: 'About Me' },
        { blockType: 'featuredWorks', blockName: 'Works', heading: 'Projects' },
        { blockType: 'featuredClients', blockName: 'Clients', heading: 'Clients' },
        { blockType: 'featuredBlog', blockName: 'Blog', heading: 'Blog' },
        { blockType: 'contactForm', blockName: 'Contact', heading: 'Contact' },
        { blockType: 'simpleCta', blockName: 'CTA', heading: 'Get Started' },
      ],
      es: [
        { blockType: 'heroHome', blockName: 'Hero', heading: 'Bienvenido' },
        { blockType: 'aboutSection', blockName: 'Acerca', heading: 'Acerca de Mí' },
        { blockType: 'featuredWorks', blockName: 'Trabajos', heading: 'Proyectos' },
        { blockType: 'featuredClients', blockName: 'Clientes', heading: 'Clientes' },
        { blockType: 'featuredBlog', blockName: 'Blog', heading: 'Blog' },
        { blockType: 'contactForm', blockName: 'Contacto', heading: 'Contacto' },
        { blockType: 'simpleCta', blockName: 'CTA', heading: 'Comenzar' },
      ],
    },
  })

  // BLOG PAGE
  await upsertPage('blog', {
    title: {
      en: 'Blog',
      es: 'Blog',
    },
    hero: { type: 'lowImpact' },
    layout: {
      en: [
        { blockType: 'listingHero', blockName: 'Hero', heading: 'Blog' },
        { blockType: 'postsGrid', blockName: 'Posts Grid' },
      ],
      es: [
        { blockType: 'listingHero', blockName: 'Hero', heading: 'Blog' },
        { blockType: 'postsGrid', blockName: 'Grid de Posts' },
      ],
    },
  })

  // CASE STUDIES PAGE
  await upsertPage('case-studies', {
    title: {
      en: 'Case Studies',
      es: 'Casos de Estudio',
    },
    hero: { type: 'lowImpact' },
    layout: {
      en: [
        { blockType: 'listingHero', blockName: 'Hero', heading: 'Case Studies' },
        { blockType: 'caseStudiesGrid', blockName: 'CS Grid' },
      ],
      es: [
        { blockType: 'listingHero', blockName: 'Hero', heading: 'Casos de Estudio' },
        { blockType: 'caseStudiesGrid', blockName: 'Grid de Casos' },
      ],
    },
  })

  console.log('✨ Done! Check http://localhost:3000/admin/collections/pages\n')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
