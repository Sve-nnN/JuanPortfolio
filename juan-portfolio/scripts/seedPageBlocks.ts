/**
 * Script to seed/migrate pages with block-based layouts
 * This will create the Home page and listing pages with pre-configured blocks
 */

import { getPayload } from 'payload'
import config from '@payload-config'

async function seedPages() {
  const payload = await getPayload({ config })

  console.log('🌱 Starting page and global seeding...')

  try {
    // Check if pages already exist
    const existingPages = await payload.find({
      collection: 'pages',
      limit: 100,
    })

    console.log(`Found ${existingPages.docs.length} existing pages`)

    // Get some sample case studies and posts for relationships
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
      `Found ${caseStudies.docs.length} case studies, ${clients.docs.length} clients, ${posts.docs.length} posts`,
    )

    // ===== SEED BLOG LISTING GLOBAL =====
    console.log('\n📝 Seeding Blog Listing global...')
    try {
      const blogListingGlobal = await payload.findGlobal({
        slug: 'blog-listing',
      })

      await payload.updateGlobal({
        slug: 'blog-listing',
        data: {
          title: 'Blog',
          description: 'Artículos sobre desarrollo web, diseño y tecnología',
          layout: [
            {
              blockType: 'listingHero',
              title: 'Blog',
              description: 'Artículos sobre desarrollo web, diseño y tecnología',
              breadcrumbs: [
                {
                  label: 'Inicio',
                  url: '/',
                },
                {
                  label: 'Blog',
                },
              ],
            },
            {
              blockType: 'postsGrid',
              postsPerPage: 12,
              showCategories: true,
              gridColumns: '3',
              showExcerpt: true,
              showDate: true,
            },
          ],
        },
      })

      console.log('✅ Blog Listing global updated')
    } catch (error) {
      console.error('❌ Error updating Blog Listing global:', error)
    }

    // ===== SEED CASE STUDIES LISTING GLOBAL =====
    console.log('\n📝 Seeding Case Studies Listing global...')
    try {
      await payload.updateGlobal({
        slug: 'case-studies-listing',
        data: {
          title: 'Casos de estudio',
          description: 'Proyectos destacados y casos de éxito',
          layout: [
            {
              blockType: 'listingHero',
              title: 'Casos de estudio',
              description: 'Proyectos destacados y casos de éxito',
              breadcrumbs: [
                {
                  label: 'Inicio',
                  url: '/',
                },
                {
                  label: 'Casos de estudio',
                },
              ],
            },
            {
              blockType: 'caseStudiesGrid',
              itemsPerPage: 12,
              showCategories: true,
              gridColumns: '3',
              showExcerpt: true,
              showDate: false,
            },
          ],
        },
      })

      console.log('✅ Case Studies Listing global updated')
    } catch (error) {
      console.error('❌ Error updating Case Studies Listing global:', error)
    }

    // ===== HOME PAGE =====
    const homePageExists = existingPages.docs.find((p) => p.slug === 'home')

    if (!homePageExists) {
      console.log('\n📄 Creating Home page...')

      const homePage = await payload.create({
        collection: 'pages',
        draft: false,
        data: {
          title: 'Home',
          hero: {
            hero: {
              type: 'none',
            },
          },
          slug: 'home',
          _status: 'published',
          content: {
            layout: [
            // Hero Home
            {
              blockType: 'heroHome',
              badge: 'Desarrollador Web Full Stack',
              title: 'Transformo ideas en experiencias digitales excepcionales',
              subtitle: 'Código limpio. Diseño impecable. Resultados tangibles.',
              description:
                'Soy un desarrollador especializado en crear sitios web y aplicaciones que no solo se ven increíbles, sino que funcionan perfectamente.',
              primaryCta: {
                label: 'Ver mi trabajo',
                url: '#work',
              },
              secondaryCta: {
                label: 'Contáctame',
                url: '#contact',
              },
              mediaPosition: 'right',
            },
            // About Section
            {
              blockType: 'aboutSection',
              eyebrow: 'Sobre mí',
              title: 'Conoce al desarrollador',
              paragraphs: [
                {
                  text: '¡Hola! Soy Juan Carlos, un desarrollador web apasionado por crear experiencias digitales excepcionales.',
                },
                {
                  text: 'Mi filosofía se centra en la colaboración y la transparencia. Me sumerjo en cada proyecto para entender a fondo tus objetivos y traducirlos en un producto digital que genere resultados tangibles.',
                },
              ],
              ctaLabel: 'Hablemos de tu proyecto',
              ctaUrl: '#contact',
              features: [
                {
                  icon: 'zap',
                  title: 'Rendimiento',
                  description: 'Sitios web ultrarrápidos para una experiencia de usuario superior.',
                },
                {
                  icon: 'monitor',
                  title: 'Responsivo',
                  description: 'Adaptabilidad perfecta a todos los dispositivos y pantallas.',
                },
                {
                  icon: 'lightbulb',
                  title: 'Intuitivo',
                  description: 'Interfaces limpias y fáciles de usar que guían al usuario.',
                },
                {
                  icon: 'trending-up',
                  title: 'SEO',
                  description: 'Optimización para motores de búsqueda desde el código.',
                },
              ],
            },
            // Featured Works
            {
              blockType: 'featuredWorks',
              title: 'Proyectos Destacados',
              description: 'Echa un vistazo a algunos de mis trabajos más recientes',
              works: caseStudies.docs.slice(0, 6).map((cs) => cs.id),
              limit: 6,
              ctaLabel: 'Ver todos los proyectos',
              ctaUrl: '/case-studies',
            },
            // Featured Clients
            {
              blockType: 'featuredClients',
              title: 'Empresas que confían en mí',
              clients: clients.docs.map((c) => c.id),
              autoScroll: true,
            },
            // Featured Blog
            {
              blockType: 'featuredBlog',
              title: 'Últimas publicaciones',
              description: 'Artículos sobre desarrollo web, diseño y tecnología',
              posts: posts.docs.map((p) => p.id),
              limit: 3,
              ctaLabel: 'Visitar el blog',
              ctaUrl: '/blog',
            },
            // Contact Form
            {
              blockType: 'contactForm',
              eyebrow: 'Contacto',
              title: 'Hablemos',
              description:
                '¿Tienes un proyecto en mente o una pregunta? Me encantaría escucharte. Rellena el formulario y me pondré en contacto contigo lo antes posible.',
              submitLabel: 'Enviar mensaje',
              contactInfo: [
                {
                  icon: 'mail',
                  title: 'Email',
                  value: 'hola@jcangulo.com',
                  href: 'mailto:hola@jcangulo.com',
                },
                {
                  icon: 'phone',
                  title: 'Teléfono',
                  value: '+1 (234) 567-89',
                  href: 'tel:+123456789',
                },
                {
                  icon: 'map-pin',
                  title: 'Ubicación',
                  value: 'Madrid, España',
                },
              ],
            },
            // Simple CTA
            {
              blockType: 'simpleCta',
              text: '¿Listo para empezar tu proyecto?',
              label: 'Contáctame ahora',
              url: '#contact',
              backgroundColor: 'primary',
            },
          ],
          },
          meta: {
            title: 'Juan Carlos Angulo - Desarrollador Web Full Stack',
            description:
              'Portfolio profesional de Juan Carlos Angulo. Desarrollo web, diseño UI/UX y soluciones digitales personalizadas.',
          },
        },
      })

      console.log(`✅ Created Home page: ${homePage.id}`)
    } else {
      console.log('✓ Home page already exists')
    }

    console.log('\n✅ Page and global seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding pages:', error)
    throw error
  }
}

// Run the seeding
seedPages()
  .then(() => {
    console.log('\n🎉 All done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })
