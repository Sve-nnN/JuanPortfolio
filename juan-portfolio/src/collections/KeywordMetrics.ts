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
            name: 'status',
            type: 'text',
        },
        {
            name: 'paaCount',
            type: 'number',
            label: 'PAA Count',
        },
        {
            name: 'paaQuestions',
            type: 'json',
            label: 'PAA Questions',
            admin: {
                description: 'People Also Ask questions fetched from SerpAPI',
            },
        },
        {
            name: 'topDomain',
            type: 'text',
            label: 'Top 4 URLs',
        },
        {
            name: 'hasAiOverview',
            type: 'checkbox',
            label: 'Has AI Overview',
        },
        {
            name: 'aiOverviewSnippet',
            type: 'textarea',
            label: 'AI Overview Snippet',
            admin: {
                description: 'Full text response from SGE/AI Overview',
            },
        },
        {
            name: 'post',
            type: 'relationship',
            relationTo: 'posts',
            index: true,
        },
        {
            name: 'page',
            type: 'relationship',
            relationTo: 'pages',
            index: true,
        },
        {
            name: 'funnelStage',
            type: 'select',
            options: [
                { label: 'Awareness (TOFU)', value: 'Awareness (TOFU)' },
                { label: 'Consideration (MOFU)', value: 'Consideration (MOFU)' },
                { label: 'Decision (BOFU)', value: 'Decision (BOFU)' },
            ],
        },
        {
            name: 'informationGain',
            type: 'textarea',
        },
        {
            name: 'recommendedFormat',
            type: 'text',
        },
        {
            name: 'clusterType',
            type: 'select',
            options: [
                { label: 'Pillar', value: 'Pillar' },
                { label: 'Supporting', value: 'Supporting' },
            ],
        },
        {
            name: 'opportunityScore',
            type: 'number',
        },
        {
            name: 'avgWordCount',
            type: 'number',
        },
        {
            name: 'competitorHeadings',
            type: 'textarea',
        },
        {
            name: 'competitorMeta',
            type: 'textarea',
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
