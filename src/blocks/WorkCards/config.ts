import type { Block } from 'payload'

export const WorkCards: Block = {
  slug: 'workCards',
  interfaceName: 'WorkCardsBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
    },
    {
      name: 'count',
      type: 'number',
      defaultValue: 6,
    },
    {
      name: 'showReadMore',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
  labels: {
    singular: 'Work cards',
    plural: 'Work cards',
  },
}

export default WorkCards
