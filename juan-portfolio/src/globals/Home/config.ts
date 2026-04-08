import type { GlobalConfig } from 'payload'
import { HeroHome } from '../../blocks/HeroHome/config'
import { AboutSection } from '../../blocks/AboutSection/config'
import { FeaturedWorks } from '../../blocks/FeaturedWorks/config'
import { FeaturedClients } from '../../blocks/FeaturedClients/config'
import { FeaturedBlog } from '../../blocks/FeaturedBlog/config'
import { FAQ } from '../../blocks/FAQ/config'
import { ContactFormBlock } from '../../blocks/ContactFormBlock/config'
import { FeaturedBlogPosts } from '../../blocks/FeaturedBlogPosts/config'
import { FeaturedCaseStudies } from '../../blocks/FeaturedCaseStudies/config'
import { AboutWithFeatures } from '../../blocks/AboutWithFeatures/config'
import { TestimonialSection } from '../../blocks/TestimonialSection/config'
import { ResultsSection } from '../../blocks/ResultsSection/config'
import { CallToAction } from '../../blocks/CallToAction/config'
import { Content } from '../../blocks/Content/config'
import { LatestBlogPosts } from '../../blocks/LatestBlogPosts/config'
import { LatestCaseStudies } from '../../blocks/LatestCaseStudies/config'
import { TestimonialsCarousel } from '../../blocks/TestimonialsCarousel/config'
import { CalendlyEmbed } from '../../blocks/CalendlyEmbed/config'

export const Home: GlobalConfig = {
  slug: 'home',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'layout',
      type: 'blocks',
      label: 'Page Layout',
      blocks: [
        // Bloques específicos para Home
        HeroHome,
        AboutSection,
        AboutWithFeatures,
        FeaturedWorks,
        FeaturedClients,
        FeaturedBlog,
        FAQ,
        FeaturedBlogPosts,
        FeaturedCaseStudies,
        ContactFormBlock,
        TestimonialSection,
        ResultsSection,
        LatestBlogPosts,
        LatestCaseStudies,
        TestimonialsCarousel,
        // Bloques generales
        CalendlyEmbed,
        CallToAction,
        Content,
      ],
      required: true,
      admin: {
        description: 'Construye la página home agregando bloques',
      },
    },
  ],
}
