import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'

export const AdBanners: CollectionConfig<'ad-banners'> = {
  slug: 'ad-banners',
  labels: {
    singular: 'Ad Banner',
    plural: 'Ad Banners',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'updatedAt'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'url',
      type: 'text',
      required: false,
      admin: {
        description: 'Optional: link to open when the banner is clicked',
      },
    },
    {
      name: 'openInNewTab',
      type: 'checkbox',
      defaultValue: true,
      label: 'Open link in new tab',
    },
  ],
}
