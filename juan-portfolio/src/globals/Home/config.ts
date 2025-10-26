import type { GlobalConfig } from 'payload'
import { HeroHome } from '../../blocks/HeroHome/config'
import { AboutSection } from '../../blocks/AboutSection/config'
import { FeaturedWorks } from '../../blocks/FeaturedWorks/config'
import { FeaturedClients } from '../../blocks/FeaturedClients/config'
import { FeaturedBlog } from '../../blocks/FeaturedBlog/config'
import { ContactFormBlock } from '../../blocks/ContactFormBlock/config'
import { ClientsCarousel } from '../../blocks/ClientsCarousel/config'
import { FeaturedBlogPosts } from '../../blocks/FeaturedBlogPosts/config'
import { FeaturedCaseStudies } from '../../blocks/FeaturedCaseStudies/config'
import { AboutWithFeatures } from '../../blocks/AboutWithFeatures/config'
import { TestimonialSection } from '../../blocks/TestimonialSection/config'
import { ResultsSection } from '../../blocks/ResultsSection/config'
import { CallToAction } from '../../blocks/CallToAction/config'
import { Content } from '../../blocks/Content/config'

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
        FeaturedBlogPosts,
        FeaturedCaseStudies,
        ClientsCarousel,
        ContactFormBlock,
        TestimonialSection,
        ResultsSection,
        // Bloques generales
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
