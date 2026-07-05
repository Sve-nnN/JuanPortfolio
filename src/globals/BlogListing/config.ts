import type { GlobalConfig } from 'payload'
import { ListingHero } from '@/blocks/ListingHero/config'
import { PostsGrid } from '@/blocks/PostsGrid/config'
import { LatestBlogPosts } from '@/blocks/LatestBlogPosts/config'
import { BlogArchiveHeader } from '@/blocks/BlogArchiveHeader/config'

import { revalidateBlogListing } from './hooks/revalidateBlogListing'
import { ADMIN_GROUP } from '@/utilities/adminGroups'

export const BlogListing: GlobalConfig = {
  slug: 'blog-listing',
  admin: {
    group: ADMIN_GROUP.CONTENIDO,
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [revalidateBlogListing],
  },
  fields: [
    { name: 'title', type: 'text', localized: true },
    { name: 'description', type: 'textarea', localized: true },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [ListingHero, PostsGrid, LatestBlogPosts, BlogArchiveHeader],
      admin: {
        description: 'Bloques personalizables para la página de blog',
      },
    },
  ],
}
