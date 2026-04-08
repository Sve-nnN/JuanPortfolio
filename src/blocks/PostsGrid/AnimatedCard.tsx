'use client'

import { motion } from 'framer-motion'
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
    <motion.div
      key={post.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group flex flex-col h-full"
    >
      <Card
        className="h-full"
        doc={post}
        relationTo="posts"
        showCategories={showCategories}
        locale={locale}
      />
    </motion.div>
  )
}
