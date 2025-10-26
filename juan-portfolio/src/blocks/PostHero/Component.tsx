import React from 'react'
import type { PostHeroBlock as PostHeroBlockType, Post } from '@/payload-types'
import { PostHero as OriginalPostHero } from '@/heros/PostHero'

export const PostHeroBlock: React.FC<PostHeroBlockType & { post?: Post }> = (props) => {
  const {
    showHero = true,
    showImage = true,
    showMeta = true,
    showCategories = true,
    heroStyle = 'full-width',
    post,
  } = props

  if (!showHero || !post) return null

  // Use the original PostHero component with customization options
  return (
    <div className={heroStyle === 'contained' ? 'container mx-auto' : ''}>
      <OriginalPostHero
        post={post}
        showImage={showImage}
        showMeta={showMeta}
        showCategories={showCategories}
      />
    </div>
  )
}
