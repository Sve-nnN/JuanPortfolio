import React from 'react'
import type { Post } from '@/payload-types'
import { PostHero as OriginalPostHero } from '@/heros/PostHero'

interface PostHeroBlockType {
  showHero?: boolean
  showImage?: boolean
  showMeta?: boolean
  showCategories?: boolean
  heroStyle?: 'full-width' | 'contained'
}

export const PostHeroBlock: React.FC<PostHeroBlockType & { post?: Post }> = (props) => {
  const { showHero = true, heroStyle = 'full-width', post } = props

  if (!showHero || !post) return null

  // Use the original PostHero component
  return (
    <div className={heroStyle === 'contained' ? 'container mx-auto' : ''}>
      <OriginalPostHero post={post} />
    </div>
  )
}
