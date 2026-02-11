import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import dynamic from 'next/dynamic'

const blockComponents: Record<string, React.ComponentType<any>> = {
  archive: dynamic(() => import('@/blocks/ArchiveBlock/Component').then((m) => m.ArchiveBlock)),
  content: dynamic(() => import('@/blocks/Content/Component').then((m) => m.ContentBlock)),
  cta: dynamic(() => import('@/blocks/CallToAction/Component').then((m) => m.CallToActionBlock)),
  formBlock: dynamic(() => import('@/blocks/Form/Component').then((m) => m.FormBlock)),
  mediaBlock: dynamic(() => import('@/blocks/MediaBlock/Component').then((m) => m.MediaBlock)),
  intro: dynamic(() => import('@/blocks/Intro/Component').then((m) => m.IntroBlock)),
  workCards: dynamic(() => import('@/blocks/WorkCards/Component').then((m) => m.WorkCardsBlock)),
  clientsCarousel: dynamic(() => import('@/blocks/ClientsCarousel/Component')),
  section: dynamic(() => import('@/blocks/Section/Component').then((m) => m.SectionBlock)),
  heroHome: dynamic(() => import('@/blocks/HeroHome/Component').then((m) => m.HeroHome)),
  aboutSection: dynamic(() =>
    import('@/blocks/AboutSection/Component').then((m) => m.AboutSection),
  ),
  featuredWorks: dynamic(() =>
    import('@/blocks/FeaturedWorks/Component').then((m) => m.FeaturedWorks),
  ),
  featuredClients: dynamic(() =>
    import('@/blocks/FeaturedClients/Component').then((m) => m.FeaturedClients),
  ),
  featuredBlog: dynamic(() =>
    import('@/blocks/FeaturedBlog/Component').then((m) => m.FeaturedBlog),
  ),
  contactForm: dynamic(() =>
    import('@/blocks/ContactFormBlock/Component').then((m) => m.ContactFormBlockComponent),
  ),
  simpleCta: dynamic(() => import('@/blocks/SimpleCTA/Component').then((m) => m.SimpleCta)),
  listingHero: dynamic(() => import('@/blocks/ListingHero/Component').then((m) => m.ListingHero)),
  postsGrid: dynamic(() => import('@/blocks/PostsGrid/Component').then((m) => m.PostsGrid)),
  caseStudiesGrid: dynamic(() =>
    import('@/blocks/CaseStudiesGrid/Component').then((m) => m.CaseStudiesGrid),
  ),
  postSidebar: dynamic(() => import('@/blocks/PostSidebar/Component').then((m) => m.PostSidebar)),
  relatedPosts: dynamic(() =>
    import('@/blocks/RelatedPostsBlock/Component').then((m) => m.RelatedPostsBlockComponent),
  ),
  tableOfContents: dynamic(() =>
    import('@/blocks/TableOfContentsBlock/Component').then((m) => m.TableOfContentsBlockComponent),
  ),
  testimonialSection: dynamic(() =>
    import('@/blocks/TestimonialSection/Component').then((m) => m.TestimonialSection),
  ),
  resultsSection: dynamic(() =>
    import('@/blocks/ResultsSection/Component').then((m) => m.ResultsSection),
  ),
  caseStudyHeader: dynamic(() =>
    import('@/blocks/CaseStudyHeader/Component').then((m) => m.CaseStudyHeader),
  ),
  postArticleHeader: dynamic(() =>
    import('@/blocks/PostArticleHeader/Component').then((m) => m.PostArticleHeader),
  ),
  blogArchiveHeader: dynamic(() =>
    import('@/blocks/BlogArchiveHeader/Component').then((m) => m.BlogArchiveHeader),
  ),
  featuredBlogPosts: dynamic(() =>
    import('@/blocks/FeaturedBlogPosts/Component').then((m) => m.FeaturedBlogPosts),
  ),
  featuredCaseStudies: dynamic(() =>
    import('@/blocks/FeaturedCaseStudies/Component').then((m) => m.FeaturedCaseStudies),
  ),
  aboutWithFeatures: dynamic(() =>
    import('@/blocks/AboutWithFeatures/Component').then((m) => m.AboutWithFeatures),
  ),
  latestBlogPosts: dynamic(() => import('@/blocks/LatestBlogPosts/Component')),
  latestCaseStudies: dynamic(() =>
    import('@/blocks/LatestCaseStudies/Component').then((m) => m.LatestCaseStudies),
  ),
  testimonialsCarousel: dynamic(() =>
    import('@/blocks/TestimonialsCarousel/Component').then((m) => m.TestimonialsCarousel),
  ),
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
                <AnimateOnScroll className="my-20 lg:my-32" key={index}>
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
