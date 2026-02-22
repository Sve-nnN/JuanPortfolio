import type { CollectionConfig, CollectionSlug } from 'payload'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { Archive } from '../../blocks/ArchiveBlock/config'
import { CallToAction } from '../../blocks/CallToAction/config'
import { Content } from '../../blocks/Content/config'
import { FormBlock } from '../../blocks/Form/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { WorkCards } from '../../blocks/WorkCards/config'
import { Intro } from '../../blocks/Intro/config'
import { HeroHome } from '../../blocks/HeroHome/config'
import { AboutSection } from '../../blocks/AboutSection/config'
import { FeaturedWorks } from '../../blocks/FeaturedWorks/config'
import { FeaturedClients } from '../../blocks/FeaturedClients/config'
import { FeaturedBlog } from '../../blocks/FeaturedBlog/config'
import { ContactFormBlock } from '../../blocks/ContactFormBlock/config'
import { SimpleCTA } from '../../blocks/SimpleCTA/config'
import { ListingHero } from '../../blocks/ListingHero/config'
import { PostsGrid } from '../../blocks/PostsGrid/config'
import { CaseStudiesGrid } from '../../blocks/CaseStudiesGrid/config'
import { PostSidebar } from '../../blocks/PostSidebar/config'
import { RelatedPostsBlock } from '../../blocks/RelatedPostsBlock/config'
import { TableOfContentsBlock } from '../../blocks/TableOfContentsBlock/config'
import { TestimonialSection } from '../../blocks/TestimonialSection/config'
import { ResultsSection } from '../../blocks/ResultsSection/config'
import { CaseStudyHeader } from '../../blocks/CaseStudyHeader/config'
import { PostArticleHeader } from '../../blocks/PostArticleHeader/config'
import { BlogArchiveHeader } from '../../blocks/BlogArchiveHeader/config'
import { FeaturedBlogPosts } from '../../blocks/FeaturedBlogPosts/config'
import { FeaturedCaseStudies } from '../../blocks/FeaturedCaseStudies/config'
import { AboutWithFeatures } from '../../blocks/AboutWithFeatures/config'
import { hero } from '@/heros/config'
import { slugField } from '@/fields/slug'
import { populatePublishedAt } from '../../hooks/populatePublishedAt'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { revalidateDelete, revalidatePage } from './hooks/revalidatePage'
import { createRedirectOnSlugChange } from '../../hooks/createRedirectOnSlugChange'
import { Section } from '../../blocks/Section/config'

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
    defaultColumns: ['title', 'slug', 'updatedAt', 'gscClicks'],
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
          name: 'hero',
          fields: [hero],
          label: {
            en: 'Hero',
            es: 'Hero',
          },
        },
        {
          name: 'homeSections',
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
              relationTo: 'clientes',
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
          name: 'content',
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              blocks: [
                // Bloques para Home
                HeroHome,
                AboutSection,
                FeaturedWorks,
                FeaturedClients,
                FeaturedBlog,
                ContactFormBlock,
                SimpleCTA,
                // Bloques para páginas de listado
                ListingHero,
                PostsGrid,
                CaseStudiesGrid,
                // Bloques para single post/case study
                PostSidebar,
                RelatedPostsBlock,
                TableOfContentsBlock,
                TestimonialSection,
                ResultsSection,
                CaseStudyHeader,
                PostArticleHeader,
                BlogArchiveHeader,
                FeaturedBlogPosts,
                FeaturedCaseStudies,
                AboutWithFeatures,
                // Section permite estilos de sección y bloques anidados (MVP page builder)
                Section,
                CallToAction,
                Content,
                MediaBlock,
                Archive,
                FormBlock,
                Intro,
                WorkCards,
              ],
              required: true,
              admin: {
                initCollapsed: true,
              },
            },
          ],
          label: 'Content',
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
        position: 'sidebar',
      },
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
        collection: 'pages',
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
    slugField(),
  ],
  hooks: {
    afterChange: [revalidatePage, createRedirectOnSlugChange],
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
