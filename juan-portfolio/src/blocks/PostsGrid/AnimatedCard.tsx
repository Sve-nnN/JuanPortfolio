'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/Card'
import type { Post } from '@/payload-types'

interface AnimatedCardProps {
  post: Post
  index: number
  showCategories: boolean
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({ post, index, showCategories }) => {
  return (
    <motion.div
      key={post.id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group flex flex-col h-full"
    >
      <Card
        className="h-full"
        doc={post}
        relationTo="posts"
        showCategories={showCategories}
      />
    </motion.div>
  )
}
