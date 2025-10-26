import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { IntroBlock } from '@/blocks/Intro/Component'
import { WorkCardsBlock } from '@/blocks/WorkCards/Component'
import ClientsCarousel from '@/blocks/ClientsCarousel/Component'
import { SectionBlock } from '@/blocks/Section/Component'
import { HeroHomeBlock } from '@/blocks/HeroHome/Component'
import { AboutSectionBlock } from '@/blocks/AboutSection/Component'
import { FeaturedWorksBlock } from '@/blocks/FeaturedWorks/Component'
import { FeaturedClientsBlock } from '@/blocks/FeaturedClients/Component'
import { FeaturedBlogBlock } from '@/blocks/FeaturedBlog/Component'
import { ContactFormBlockComponent } from '@/blocks/ContactFormBlock/Component'
import { SimpleCtaBlock } from '@/blocks/SimpleCTA/Component'
import { ListingHeroBlock } from '@/blocks/ListingHero/Component'
import { PostsGridBlock } from '@/blocks/PostsGrid/Component'
import { CaseStudiesGridBlock } from '@/blocks/CaseStudiesGrid/Component'
import { PostSidebarBlock } from '@/blocks/PostSidebar/Component'
import { RelatedPostsBlockComponent } from '@/blocks/RelatedPostsBlock/Component'
import { TableOfContentsBlockComponent } from '@/blocks/TableOfContentsBlock/Component'
import { TestimonialSectionBlock } from '@/blocks/TestimonialSection/Component'
import { ResultsSectionBlock } from '@/blocks/ResultsSection/Component'
import { CaseStudyHeaderBlock } from '@/blocks/CaseStudyHeader/Component'
import { PostArticleHeaderBlock } from '@/blocks/PostArticleHeader/Component'
import { BlogArchiveHeaderBlock } from '@/blocks/BlogArchiveHeader/Component'
import { FeaturedBlogPostsBlock } from '@/blocks/FeaturedBlogPosts/Component'
import { FeaturedCaseStudiesBlock } from '@/blocks/FeaturedCaseStudies/Component'
import { AboutWithFeaturesBlock } from '@/blocks/AboutWithFeatures/Component'

const blockComponents: Record<string, React.ComponentType<any>> = {
  archive: ArchiveBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  formBlock: FormBlock,
  mediaBlock: MediaBlock,
  intro: IntroBlock,
  workCards: WorkCardsBlock,
  clientsCarousel: ClientsCarousel,
  section: SectionBlock,
  heroHome: HeroHomeBlock,
  aboutSection: AboutSectionBlock,
  featuredWorks: FeaturedWorksBlock,
  featuredClients: FeaturedClientsBlock,
  featuredBlog: FeaturedBlogBlock,
  contactForm: ContactFormBlockComponent,
  simpleCta: SimpleCtaBlock,
  listingHero: ListingHeroBlock,
  postsGrid: PostsGridBlock,
  caseStudiesGrid: CaseStudiesGridBlock,
  postSidebar: PostSidebarBlock,
  relatedPosts: RelatedPostsBlockComponent,
  tableOfContents: TableOfContentsBlockComponent,
  testimonialSection: TestimonialSectionBlock,
  resultsSection: ResultsSectionBlock,
  caseStudyHeader: CaseStudyHeaderBlock,
  postArticleHeader: PostArticleHeaderBlock,
  blogArchiveHeader: BlogArchiveHeaderBlock,
  featuredBlogPosts: FeaturedBlogPostsBlock,
  featuredCaseStudies: FeaturedCaseStudiesBlock,
  aboutWithFeatures: AboutWithFeaturesBlock,
}

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block as any

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            if (Block) {
              return (
                <div className="my-16" key={index}>
                  {/* @ts-expect-error there may be some mismatch between the expected types here */}
                  <Block {...block} />
                </div>
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
