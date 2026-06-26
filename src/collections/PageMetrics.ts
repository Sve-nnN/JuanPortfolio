import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'

export const PageMetrics: CollectionConfig = {
  slug: 'page-metrics',
  labels: {
    singular: { en: 'Page Metric', es: 'Métrica de Página' },
    plural: { en: 'Page Metrics', es: 'Métricas de Página' },
  },
  admin: {
    useAsTitle: 'url',
    defaultColumns: ['url', 'mobile.score', 'lastScan'],
    group: 'SEO',
    components: {
      beforeListTable: ['@/components/admin/ScanAllButton#ScanAllButton'],
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
      name: 'url',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'forceScan',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/components/admin/ForceScanButton#ForceScanButton',
        },
      },
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
          name: 'score',
          type: 'number',
          label: 'Performance Score (0-100)',
          admin: {
            components: {
              Field: '@/components/admin/CWVBadge#CWVBadge',
            },
          },
          custom: {
            metric: 'score',
          },
        },
        {
          name: 'lcp',
          type: 'number',
          label: 'Largest Contentful Paint (s)',
          admin: {
            components: {
              Field: '@/components/admin/CWVBadge#CWVBadge',
            },
          },
          custom: {
            metric: 'lcp',
          },
        },
        {
          name: 'cls',
          type: 'number',
          label: 'Cumulative Layout Shift',
          admin: {
            components: {
              Field: '@/components/admin/CWVBadge#CWVBadge',
            },
          },
          custom: {
            metric: 'cls',
          },
        },
        {
          name: 'inp',
          type: 'number',
          label: 'Interaction to Next Paint (ms)',
          admin: {
            components: {
              Field: '@/components/admin/CWVBadge#CWVBadge',
            },
          },
          custom: {
            metric: 'inp',
          },
        },
        {
          name: 'fcp',
          type: 'number',
          label: 'First Contentful Paint (s)',
          admin: {
            components: {
              Field: '@/components/admin/CWVBadge#CWVBadge',
            },
          },
          custom: {
            metric: 'fcp',
          },
        },
        {
          name: 'fid',
          type: 'number',
          label: 'First Input Delay (ms)',
          admin: {
            components: {
              Field: '@/components/admin/CWVBadge#CWVBadge',
            },
          },
          custom: {
            metric: 'fid',
          },
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
