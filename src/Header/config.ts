import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateHeader } from './hooks/revalidateHeader'
import { ADMIN_GROUP } from '@/utilities/adminGroups'

export const Header: GlobalConfig = {
  slug: 'header',
  admin: {
    group: ADMIN_GROUP.SITIO,
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
    },
    {
      name: 'cta',
      type: 'group',
      label: 'Call to Action',
      admin: {
        description: 'Primary CTA button displayed in the header',
      },
      fields: [
        link({
          appearances: false,
          overrides: {
            label: 'CTA Link',
          },
        }),
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
