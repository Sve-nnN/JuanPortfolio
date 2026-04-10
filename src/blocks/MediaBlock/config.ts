import type { Block } from 'payload'

import { animationField } from '@/fields/animation'

export const MediaBlock: Block = {
  slug: 'mediaBlock',
  interfaceName: 'MediaBlock',
  fields: [
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    animationField(),
  ],
}
