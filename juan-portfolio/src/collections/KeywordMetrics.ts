import { CollectionConfig } from 'payload'

export const KeywordMetrics: CollectionConfig = {
    slug: 'keyword-metrics',
    admin: {
        useAsTitle: 'keyword',
        defaultColumns: ['keyword', 'volume', 'difficulty', 'clicks', 'avgPosition'],
    },
    access: {
        read: () => true,
        create: () => true,
        update: () => true,
    },
    fields: [
        {
            name: 'keyword',
            type: 'text',
            required: true,
            unique: true,
            index: true,
        },
        {
            name: 'targetURL',
            type: 'text',
            index: true,
        },
        {
            name: 'volume',
            type: 'number',
            required: true,
        },
        {
            name: 'difficulty',
            type: 'number',
            required: true,
        },
        {
            name: 'intent',
            type: 'select',
            options: [
                { label: 'Informational', value: 'Informational' },
                { label: 'Commercial', value: 'Commercial' },
                { label: 'Transactional', value: 'Transactional' },
                { label: 'Navigational', value: 'Navigational' },
            ],
        },
        {
            name: 'source',
            type: 'text',
            required: true,
        },
        {
            type: 'row',
            fields: [
                {
                    name: 'clicks',
                    type: 'number',
                    admin: { readOnly: true },
                },
                {
                    name: 'impressions',
                    type: 'number',
                    admin: { readOnly: true },
                },
                {
                    name: 'ctr',
                    type: 'number',
                    admin: { readOnly: true },
                },
                {
                    name: 'avgPosition',
                    type: 'number',
                    admin: { readOnly: true },
                },
            ],
        },
        {
            name: 'lastGSCUpdate',
            type: 'date',
            admin: { readOnly: true },
        },
    ],
}
