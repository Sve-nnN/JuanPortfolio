import type { CollectionConfig } from 'payload'

export const PageMetrics: CollectionConfig = {
  slug: 'page-metrics',
  admin: {
    useAsTitle: 'url',
    defaultColumns: ['url', 'mobile.score', 'lastScan'],
  },
  access: {
    read: () => true,
    create: () => true, // Restrict this in production to admin/cron
    update: () => true, // Restrict this in production to admin/cron
  },
  fields: [
    {
      name: 'url',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'path',
      type: 'text',
      index: true,
      admin: {
        description: 'The path of the URL (e.g. /about)',
      },
    },
    {
      name: 'lastScan',
      type: 'date',
      admin: {
        description: 'Date of the last PageSpeed Insights scan',
      },
    },
    {
      name: 'mobile',
      type: 'group',
      fields: [
        {
          name: 'lcp',
          type: 'number',
          label: 'Largest Contentful Paint (s)',
        },
        {
          name: 'fcp',
          type: 'number',
          label: 'First Contentful Paint (s)',
        },
        {
          name: 'fid',
          type: 'number',
          label: 'First Input Delay (ms)',
        },
        {
          name: 'inp',
          type: 'number',
          label: 'Interaction to Next Paint (ms)',
        },
        {
          name: 'cls',
          type: 'number',
          label: 'Cumulative Layout Shift',
        },
        {
          name: 'score',
          type: 'number',
          label: 'Performance Score (0-100)',
        },
      ],
    },
    {
      name: 'history',
      type: 'array',
      fields: [
        {
          name: 'date',
          type: 'date',
        },
        {
          name: 'metrics',
          type: 'group',
          fields: [
            {
              name: 'lcp',
              type: 'number',
            },
            {
              name: 'fcp',
              type: 'number',
            },
            {
              name: 'fid',
              type: 'number',
            },
            {
              name: 'inp',
              type: 'number',
            },
            {
              name: 'cls',
              type: 'number',
            },
            {
              name: 'score',
              type: 'number',
            },
          ],
        },
      ],
    },
  ],
}
