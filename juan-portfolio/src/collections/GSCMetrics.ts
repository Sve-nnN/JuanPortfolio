import type { CollectionConfig } from 'payload'

export const GSCMetrics: CollectionConfig = {
  slug: 'gsc-metrics',
  admin: {
    useAsTitle: 'query',
    defaultColumns: ['date', 'page', 'query', 'clicks', 'impressions', 'indexStatus'],
    group: 'SEO',
    components: {
      beforeListTable: ['@/components/admin/GSCAnalysis#GSCAnalysis'],
    },
  },
  access: {
    read: () => true,
    create: () => true, // Restrict to admin/cron in production
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'date',
      type: 'date',
      required: true,
      index: true,
    },
    {
      name: 'page',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'query',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'clicks',
      type: 'number',
      required: true,
    },
    {
      name: 'impressions',
      type: 'number',
      required: true,
    },
    {
      name: 'ctr',
      type: 'number',
      required: true,
    },
    {
      name: 'position',
      type: 'number',
      required: true,
    },
    {
      name: 'country',
      type: 'text',
    },
    {
      name: 'device',
      type: 'text',
    },
    {
      name: 'indexStatus',
      type: 'select',
      options: [
        { label: 'Indexed', value: 'INDEXED' },
        { label: 'Not Indexed', value: 'NOT_INDEXED' },
        { label: 'Unknown', value: 'UNKNOWN' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'lastInspected',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
