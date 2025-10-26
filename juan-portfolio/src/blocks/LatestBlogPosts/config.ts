import type { Block } from 'payload'

export const LatestBlogPosts: Block = {
  slug: 'latestBlogPosts',
  interfaceName: 'LatestBlogPostsBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Título',
      required: false,
      defaultValue: 'Últimos posts del blog',
    },
    {
      name: 'count',
      type: 'number',
      label: 'Cantidad de posts',
      required: false,
      defaultValue: 3,
      min: 1,
      max: 12,
    },
  ],
}

export default LatestBlogPosts
