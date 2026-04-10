'use client'

import { m } from 'framer-motion'
import { Card } from '@/components/Card'
import type { Post } from '@/payload-types'

interface AnimatedCardProps {
  post: Post
  index: number
  showCategories: boolean
  locale?: 'en' | 'es'
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  post,
  index,
  showCategories,
  locale,
}) => {
  return (
    <m.div
      key={post.id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.08, 0.24) }}
      viewport={{ once: true, margin: '0px 0px -100px 0px' }}
      className="group flex flex-col h-full"
    >
      <Card
        className="h-full"
        doc={post}
        relationTo="posts"
        showCategories={showCategories}
        locale={locale}
      />
    </m.div>
  )
}
