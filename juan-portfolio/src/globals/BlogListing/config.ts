import type { GlobalConfig } from 'payload'
import { ListingHero } from '@/blocks/ListingHero/config'
import { PostsGrid } from '@/blocks/PostsGrid/config'
import { LatestBlogPosts } from '@/blocks/LatestBlogPosts/config'

export const BlogListing: GlobalConfig = {
  slug: 'blog-listing',
  access: {
    read: () => true,
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'description', type: 'textarea', localized: true },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [ListingHero, PostsGrid, LatestBlogPosts],
      admin: {
        description: 'Bloques personalizables para la página de blog',
      },
    },
  ],
}
