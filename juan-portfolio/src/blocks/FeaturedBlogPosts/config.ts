import type { Block } from 'payload'

export const FeaturedBlogPosts: Block = {
  slug: 'featuredBlogPosts',
  interfaceName: 'FeaturedBlogPostsBlock',
  labels: {
    singular: 'Featured Blog Posts',
    plural: 'Featured Blog Posts',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Section Title',
      defaultValue: 'Desde mi Blog',
      localized: true,
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Section Description',
      defaultValue: 'Artículos y tutoriales sobre desarrollo web y SEO.',
      localized: true,
    },
    {
      name: 'posts',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
      maxRows: 3,
      label: 'Featured Posts',
      admin: {
        description: 'Select up to 3 posts to feature',
      },
    },
    {
      name: 'ctaText',
      type: 'text',
      label: 'CTA Button Text',
      defaultValue: 'Visitar el blog',
      localized: true,
    },
    {
      name: 'ctaLink',
      type: 'text',
      label: 'CTA Button Link',
      defaultValue: '/blog',
    },
    {
      name: 'backgroundColor',
      type: 'select',
      label: 'Background Color',
      defaultValue: 'gray',
      options: [
        { label: 'White', value: 'white' },
        { label: 'Gray', value: 'gray' },
        { label: 'Primary', value: 'primary' },
      ],
    },
  ],
}
