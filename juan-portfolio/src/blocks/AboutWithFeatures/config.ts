import type { Block } from 'payload'

export const AboutWithFeatures: Block = {
  slug: 'aboutWithFeatures',
  interfaceName: 'AboutWithFeaturesBlock',
  labels: {
    singular: 'About With Features',
    plural: 'About With Features',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Eyebrow Text',
      defaultValue: 'Sobre mí',
      localized: true,
    },
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      defaultValue: 'Conoce al desarrollador',
      localized: true,
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Description',
      localized: true,
    },
    {
      name: 'ctaText',
      type: 'text',
      label: 'CTA Text',
      defaultValue: 'Hablemos de tu proyecto',
      localized: true,
    },
    {
      name: 'ctaLink',
      type: 'text',
      label: 'CTA Link',
      defaultValue: '#contact',
    },
    {
      name: 'features',
      type: 'array',
      label: 'Features',
      minRows: 4,
      maxRows: 4,
      fields: [
        {
          name: 'icon',
          type: 'select',
          label: 'Icon',
          options: [
            { label: 'Speed (Performance)', value: 'Zap' },
            { label: 'Devices (Responsive)', value: 'Monitor' },
            { label: 'Lightbulb (Intuitive)', value: 'Lightbulb' },
            { label: 'Trending Up (SEO)', value: 'TrendingUp' },
            { label: 'Code', value: 'Code' },
            { label: 'Palette', value: 'Palette' },
            { label: 'Shield', value: 'Shield' },
            { label: 'Rocket', value: 'Rocket' },
          ],
        },
        {
          name: 'title',
          type: 'text',
          label: 'Feature Title',
          required: true,
          localized: true,
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Feature Description',
          required: true,
          localized: true,
        },
      ],
    },
  ],
}
