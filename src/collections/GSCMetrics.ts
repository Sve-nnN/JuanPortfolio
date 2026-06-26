import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'

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
    create: authenticated,
    update: authenticated,
    delete: authenticated,
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
      name: 'indexingIssue',
      type: 'text',
      label: 'Motivo de no-indexación',
      admin: {
        position: 'sidebar',
        description: 'Razón técnica de GSC (ej. Rastreada pero no indexada)',
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
