import type { CollectionConfig, CollectionSlug } from 'payload'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { Archive } from '../../blocks/ArchiveBlock/config'
import { CallToAction } from '../../blocks/CallToAction/config'
import { Content } from '../../blocks/Content/config'
import { FormBlock } from '../../blocks/Form/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { WorkCards } from '../../blocks/WorkCards/config'
import { ClientsCarousel } from '../../blocks/ClientsCarousel/config'
import { Intro } from '../../blocks/Intro/config'
import { hero } from '@/heros/config'
import { slugField } from 'payload'
import { populatePublishedAt } from '../../hooks/populatePublishedAt'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { revalidateDelete, revalidatePage } from './hooks/revalidatePage'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

export const Pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  // This config controls what's populated by default when a page is referenced
  // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
  // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'pages'>
  defaultPopulate: {
    title: true,
    slug: true,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'pages',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'pages',
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
          fields: [hero],
          label: {
            en: 'Hero',
            es: 'Hero',
          },
        },
        {
          label: {
            en: 'Home Sections',
            es: 'Secciones Home',
          },
          fields: [
            {
              name: 'featuredWorks',
              type: 'relationship',
              // Cast to CollectionSlug to satisfy typing until payload-types are regenerated
              relationTo: 'case-studies' as CollectionSlug,
              hasMany: true,
              admin: {
                description: 'Selecciona los trabajos destacados que aparecerán en la home',
              },
            },
            {
              name: 'featuredClients',
              type: 'relationship',
              relationTo: 'clients',
              hasMany: true,
              admin: {
                description: 'Selecciona los clientes destacados para la sección de empresas',
              },
            },
            {
              name: 'blogTitle',
              type: 'text',
              localized: true,
              label: { en: 'Blog Title', es: 'Título del Blog' },
            },
            {
              name: 'blogDescription',
              type: 'textarea',
              localized: true,
              label: { en: 'Blog Description', es: 'Descripción del Blog' },
            },
          ],
        },
        {
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              blocks: [CallToAction, Content, MediaBlock, Archive, FormBlock, Intro, WorkCards, ClientsCarousel],
              required: true,
              // localize layout so pages can have different block content per locale
              localized: true,
              admin: {
                initCollapsed: true,
              },
            },
          ],
          label: 'Content',
        },
        {
          name: 'meta',
          label: {
            en: 'SEO',
            es: 'SEO',
          },
          // Localize meta so title/description/image can be different per locale
          localized: true,
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    slugField(),
  ],
  hooks: {
    afterChange: [revalidatePage],
    beforeChange: [populatePublishedAt],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100, // We set this interval for optimal live preview
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
