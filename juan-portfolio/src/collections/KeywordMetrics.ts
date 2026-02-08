import { CollectionConfig } from 'payload'

export const KeywordMetrics: CollectionConfig = {
    slug: 'keyword-metrics',
    admin: {
        useAsTitle: 'keyword',
    },
    access: {
        read: () => true,
        create: () => true, // Secure this in prod
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
            name: 'source',
            type: 'text',
            required: true, // e.g., 'google-ads', 'dataforseo', 'sandbox', 'serpapi'
        },
        // Payload adds createdAt and updatedAt automatically
    ],
}
