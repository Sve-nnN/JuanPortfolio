import React from 'react'
import type { RequiredDataFromCollectionSlug } from 'payload'
import Hero from '@/components/home/Hero'
import Intro from '@/components/home/Intro'
import WorkCards from '@/components/home/WorkCards'
import ClientsCarousel from '@/components/home/ClientsCarousel'
import BlogList from '@/components/home/BlogList'
import ContactForm from '@/components/home/ContactForm'
import CTA from '@/components/home/CTA'
import About from '@/components/home/About'
import { t, type Locale } from '@/i18n/translations'

const HomePage = async ({ page, locale = 'es' }: { page: RequiredDataFromCollectionSlug<'pages'>; locale?: Locale }) => {
  // (Opcional) podemos consultar posts desde Payload aquí si queremos hacer BlogList dinámico

  return (
    <div>
      <Hero hero={page.hero} locale={locale} />
      <About page={page} />
      <Intro page={page} />

      <section id="work" className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-current">
              {t(locale, 'home.work.title')}
            </h2>
            <p className="mt-4 text-lg text-muted">{t(locale, 'home.work.description')}</p>
          </div>
          <WorkCards />
          <div className="text-center mt-12">
            <a
              className="bg-primary text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
              href="#"
            >
              {t(locale, 'home.work.viewAll')}
            </a>
          </div>
        </div>
      </section>

      <ClientsCarousel />

      <section id="blog" className="py-20 md:py-28 bg-gray-50 dark:bg-card-dark">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-current">
              {t(locale, 'home.blog.title')}
            </h2>
            <p className="mt-4 text-lg text-muted">
              {t(locale, 'home.blog.description')}
            </p>
          </div>
          <BlogList />
          <div className="text-center mt-12">
            <a
              className="bg-primary text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
              href="#"
            >
              {t(locale, 'home.blog.visitBlog')}
            </a>
          </div>
        </div>
      </section>

      <section id="contact" className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ContactForm />
        </div>
      </section>

      <CTA data={{ label: t(locale, 'home.contact.cta'), url: '/contact' }} />
    </div>
  )
}

export default HomePage
