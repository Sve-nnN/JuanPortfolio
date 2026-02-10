import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { ArchiveBlock as ArchiveBlockComponent } from '@/blocks/ArchiveBlock/Component'
import { CallToActionBlock as CallToActionBlockComponent } from '@/blocks/CallToAction/Component'
import { ContentBlock as ContentBlockComponent } from '@/blocks/Content/Component'
import { FormBlock as FormBlockComponent } from '@/blocks/Form/Component'
import { MediaBlock as MediaBlockComponent } from '@/blocks/MediaBlock/Component'
import { IntroBlock as IntroBlockComponent } from '@/blocks/Intro/Component'
import { WorkCardsBlock as WorkCardsBlockComponent } from '@/blocks/WorkCards/Component'
import ClientsCarouselComponent from '@/blocks/ClientsCarousel/Component'
import { SectionBlock as SectionBlockComponent } from '@/blocks/Section/Component'
import { HeroHome as HeroHomeBlockComponent } from '@/blocks/HeroHome/Component'
import { AboutSection as AboutSectionBlockComponent } from '@/blocks/AboutSection/Component'
import { FeaturedWorks as FeaturedWorksBlockComponent } from '@/blocks/FeaturedWorks/Component'
import { FeaturedClients as FeaturedClientsBlockComponent } from '@/blocks/FeaturedClients/Component'
import { FeaturedBlog as FeaturedBlogBlockComponent } from '@/blocks/FeaturedBlog/Component'
import { ContactFormBlockComponent } from '@/blocks/ContactFormBlock/Component'
import { SimpleCta as SimpleCtaBlockComponent } from '@/blocks/SimpleCTA/Component'
import { ListingHero as ListingHeroBlockComponent } from '@/blocks/ListingHero/Component'
import { PostsGrid as PostsGridBlockComponent } from '@/blocks/PostsGrid/Component'
import { CaseStudiesGrid as CaseStudiesGridBlockComponent } from '@/blocks/CaseStudiesGrid/Component'
import { PostSidebar as PostSidebarBlockComponent } from '@/blocks/PostSidebar/Component'
import { RelatedPostsBlockComponent } from '@/blocks/RelatedPostsBlock/Component'
import { TableOfContentsBlockComponent } from '@/blocks/TableOfContentsBlock/Component'
import { TestimonialSection as TestimonialSectionBlockComponent } from '@/blocks/TestimonialSection/Component'
import { ResultsSection as ResultsSectionBlockComponent } from '@/blocks/ResultsSection/Component'
import { CaseStudyHeader as CaseStudyHeaderBlockComponent } from '@/blocks/CaseStudyHeader/Component'
import { PostArticleHeader as PostArticleHeaderBlockComponent } from '@/blocks/PostArticleHeader/Component'
import { BlogArchiveHeader as BlogArchiveHeaderBlockComponent } from '@/blocks/BlogArchiveHeader/Component'
import { FeaturedBlogPosts as FeaturedBlogPostsBlockComponent } from '@/blocks/FeaturedBlogPosts/Component'
import { FeaturedCaseStudies as FeaturedCaseStudiesBlockComponent } from '@/blocks/FeaturedCaseStudies/Component'
import { AboutWithFeatures as AboutWithFeaturesBlockComponent } from '@/blocks/AboutWithFeatures/Component'
import LatestBlogPostsBlockComponent from '@/blocks/LatestBlogPosts/Component'
import { LatestCaseStudies as LatestCaseStudiesBlockComponent } from '@/blocks/LatestCaseStudies/Component'
import { TestimonialsCarousel as TestimonialsCarouselBlockComponent } from '@/blocks/TestimonialsCarousel/Component'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const blockComponents: Record<string, React.ComponentType<any>> = {
  archive: ArchiveBlockComponent,
  content: ContentBlockComponent,
  cta: CallToActionBlockComponent,
  formBlock: FormBlockComponent,
  mediaBlock: MediaBlockComponent,
  intro: IntroBlockComponent,
  workCards: WorkCardsBlockComponent,
  clientsCarousel: ClientsCarouselComponent,
  section: SectionBlockComponent,
  heroHome: HeroHomeBlockComponent,
  aboutSection: AboutSectionBlockComponent,
  featuredWorks: FeaturedWorksBlockComponent,
  featuredClients: FeaturedClientsBlockComponent,
  featuredBlog: FeaturedBlogBlockComponent,
  contactForm: ContactFormBlockComponent,
  simpleCta: SimpleCtaBlockComponent,
  listingHero: ListingHeroBlockComponent,
  postsGrid: PostsGridBlockComponent,
  caseStudiesGrid: CaseStudiesGridBlockComponent,
  postSidebar: PostSidebarBlockComponent,
  relatedPosts: RelatedPostsBlockComponent,
  tableOfContents: TableOfContentsBlockComponent,
  testimonialSection: TestimonialSectionBlockComponent,
  resultsSection: ResultsSectionBlockComponent,
  caseStudyHeader: CaseStudyHeaderBlockComponent,
  postArticleHeader: PostArticleHeaderBlockComponent,
  blogArchiveHeader: BlogArchiveHeaderBlockComponent,
  featuredBlogPosts: FeaturedBlogPostsBlockComponent,
  featuredCaseStudies: FeaturedCaseStudiesBlockComponent,
  aboutWithFeatures: AboutWithFeaturesBlockComponent,
  latestBlogPosts: LatestBlogPostsBlockComponent,
  latestCaseStudies: LatestCaseStudiesBlockComponent,
  testimonialsCarousel: TestimonialsCarouselBlockComponent,
}

import { AnimateOnScroll } from '@/components/AnimateOnScroll'

export const RenderBlocks: React.FC<{
  blocks: Page['content']['layout']
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const blockType = (block as { blockType?: string }).blockType
          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]
            if (Block) {
              if (index === 0) {
                return (
                  <div className="mb-16" key={index}>
                    <Block {...block} />
                  </div>
                )
              }

              return (
                <AnimateOnScroll 
                  className="my-20 lg:my-32" 
                  key={index}
                >
                  <Block {...block} />
                </AnimateOnScroll>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
