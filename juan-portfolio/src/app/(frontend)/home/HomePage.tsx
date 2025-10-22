import React from 'react'
import type { RequiredDataFromCollectionSlug } from 'payload'
// payload imports removed: not used in the static composition (can be re-added for dynamic blog)
import Hero from '@/components/home/Hero'
import Intro from '@/components/home/Intro'
import WorkCards from '@/components/home/WorkCards'
import ClientsCarousel from '@/components/home/ClientsCarousel'
import BlogList from '@/components/home/BlogList'
import ContactForm from '@/components/home/ContactForm'
import CTA from '@/components/home/CTA'
import About from '@/components/home/About'

const HomePage = async ({ page }: { page: RequiredDataFromCollectionSlug<'pages'> }) => {
  // (Opcional) podemos consultar posts desde Payload aquí si queremos hacer BlogList dinámico

  return (
    <div>
      <Hero hero={page.hero} />
      <About page={page} />
      <Intro page={page} />

      <section id="work" className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-current">
              Casos de Estudio
            </h2>
            <p className="mt-4 text-lg text-muted">Una selección de mis trabajos más recientes.</p>
          </div>
          <WorkCards />
          <div className="text-center mt-12">
            <a
              className="bg-primary text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
              href="#"
            >
              Ver todos los casos de estudio
            </a>
          </div>
        </div>
      </section>

      <ClientsCarousel />

      <section id="blog" className="py-20 md:py-28 bg-gray-50 dark:bg-card-dark">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-current">
              Desde mi Blog
            </h2>
            <p className="mt-4 text-lg text-muted">
              Artículos y tutoriales sobre desarrollo web y SEO.
            </p>
          </div>
          <BlogList />
          <div className="text-center mt-12">
            <a
              className="bg-primary text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
              href="#"
            >
              Visitar el blog
            </a>
          </div>
        </div>
      </section>

      <section id="contact" className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ContactForm />
        </div>
      </section>

      <CTA data={{ label: 'Contacta conmigo', url: '/contact' }} />
    </div>
  )
}

export default HomePage
