import type { CollectionConfig } from 'payload'
import type { AdBanner as AdBannerType } from 'payload-types'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { ADMIN_GROUP } from '@/utilities/adminGroups'

export const AdBannersCollection: CollectionConfig<'ad-banners'> = {
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
    group: ADMIN_GROUP.MARKETING,
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

export type AdBanner = AdBannerType