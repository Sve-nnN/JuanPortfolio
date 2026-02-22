import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
  OrderedListFeature,
  UnorderedListFeature,
  ChecklistFeature,
  BlockquoteFeature,
  LinkFeature,
} from '@payloadcms/richtext-lexical'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { Banner } from '../../blocks/Banner/config'
import { Code } from '../../blocks/Code/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { FAQ } from '../../blocks/FAQ/config'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { populateAuthors } from './hooks/populateAuthors'
import { revalidateDelete, revalidatePost } from './hooks/revalidatePost'
import { triggerCWVScan } from './hooks/triggerCWVScan'
import { updateInternalLinksCount } from './hooks/updateInternalLinksCount'

import { slugField } from '@/fields/slug'

export const Posts: CollectionConfig<'posts'> = {
  slug: 'posts',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  defaultPopulate: {
    title: true,
    slug: true,
    authors: true,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt', 'gscClicks', 'internalLinksCount'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'posts',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'posts',
        req,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: {
        en: 'Title',
        es: 'Título',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          name: 'content',
          fields: [
            {
              name: 'heroImage',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'content',
              type: 'richText',
              localized: true,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                    BlocksFeature({ blocks: [Banner, Code, MediaBlock, FAQ] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                    OrderedListFeature(),
                    UnorderedListFeature(),
                    ChecklistFeature(),
                    BlockquoteFeature(),
                    LinkFeature({
                      enabledCollections: ['pages', 'posts'],
                      fields: ({ defaultFields }) => {
                        const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
                          if ('name' in field && field.name === 'url') return false
                          return true
                        })

                        return [
                          ...defaultFieldsWithoutUrl,
                          {
                            name: 'url',
                            type: 'text',
                            admin: {
                              condition: (_data, siblingData) =>
                                siblingData?.linkType !== 'internal',
                            },
                            label: ({ t }) => t('fields:enterURL'),
                            required: true,
                          },
                        ]
                      },
                    }),
                  ]
                },
              }),
              label: false,
              required: true,
            },
          ],
        },
        {
          label: 'Meta',
          fields: [
            {
              name: 'primaryKeyword',
              type: 'relationship',
              relationTo: 'keyword-metrics',
              admin: {
                position: 'sidebar',
              },
            },
            {
              name: 'semanticKeywords',
              type: 'relationship',
              relationTo: 'keyword-metrics',
              hasMany: true,
              admin: {
                position: 'sidebar',
              },
            },
            {
              name: 'relatedPosts',
              type: 'relationship',
              admin: {
                position: 'sidebar',
              },
              filterOptions: ({ id }) => {
                return {
                  id: {
                    not_in: [id],
                  },
                }
              },
              hasMany: true,
              relationTo: 'posts',
            },
            {
              name: 'categories',
              type: 'relationship',
              admin: {
                position: 'sidebar',
              },
              hasMany: true,
              relationTo: 'categories',
            },
            {
              name: 'sidebarBanners',
              label: 'Sidebar Banners',
              type: 'relationship',
              relationTo: 'ad-banners',
              hasMany: true,
              admin: {
                description: 'Select banners to show in the right sidebar for this post.',
              },
            },
          ],
        },
        {
          name: 'searchConsole',
          label: 'Search Console',
          fields: [
            {
              name: 'gscData',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/components/admin/GSCField#GSCField',
                },
              },
            },
          ],
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    {
      name: 'authors',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      hasMany: true,
      relationTo: 'users',
    },
    {
      name: 'populatedAuthors',
      type: 'array',
      access: {
        update: () => false,
      },
      admin: {
        disabled: true,
        readOnly: true,
      },
      fields: [
        {
          name: 'id',
          type: 'text',
        },
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    {
      name: 'gscClicks',
      type: 'ui',
      admin: {
        components: {
          Cell: '@/components/admin/GSCCell#GSCCell',
        },
      },
      custom: {
        collection: 'posts',
      },
    },
    {
      name: 'indexingControl',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/components/admin/IndexingControl#IndexingControl',
        },
      },
    },
    {
      name: 'indexStatus',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Estado de indexación en Google. Se actualiza con Check Status.',
      },
    },
    {
      name: 'internalLinksCount',
      type: 'number',
      admin: {
        position: 'sidebar',
        description: 'Número de enlaces internos detectados en el contenido.',
        readOnly: true,
      },
    },
    slugField(),
  ],
  hooks: {
    afterChange: [revalidatePost, triggerCWVScan],
    beforeChange: [updateInternalLinksCount],
    afterRead: [populateAuthors],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
