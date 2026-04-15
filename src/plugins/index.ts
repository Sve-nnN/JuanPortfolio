import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
// Volver al plugin SEO oficial de Payload
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin } from '@payloadcms/plugin-search'
import { Plugin } from 'payload'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
// import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { searchFields } from '@/search/fieldOverrides'
import { beforeSyncWithSearch } from '@/search/beforeSync'
import { getServerSideURL } from '@/utilities/getURL'

// Generadores simples para el plugin oficial
// Nota: el plugin oficial puede funcionar sin estos, pero ayudan con valores por defecto.
const generateTitle = ({ doc }: { doc: { title?: string } }) => {
  return doc?.title ? `${doc.title} | Juan Portfolio` : 'Juan Portfolio'
}

const generateURL = ({ doc, collection }: { doc: { slug?: string }; collection?: string }) => {
  const url = getServerSideURL() || 'http://localhost:3000'
  const slug = doc?.slug || ''
  
  if (collection === 'posts' || collection === 'categories') {
    return `${url}/blog/${slug}`
  }
  
  if (collection === 'case-studies') {
    return `${url}/case-studies/${slug}`
  }

  return slug ? `${url}/${slug === 'home' ? '' : slug}` : url
}

export const plugins: Plugin[] = [
  redirectsPlugin({
    collections: ['pages', 'posts'],
    overrides: {
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: 'You will need to rebuild the website when changing this field.',
              },
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  nestedDocsPlugin({
    collections: ['categories'],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  seoPlugin({
    collections: ['pages', 'posts', 'case-studies'],
    globals: ['home', 'blog-listing', 'case-studies-listing'],
    uploadsCollection: 'media',
    generateTitle,
    generateURL,
    // Add custom jsonLD field to all SEO tabs
    // @ts-expect-error - payload-plugin-seo types might vary
    fields: [
      {
        name: 'jsonLD',
        type: 'json',
        label: 'Schema JSON-LD Customizado',
        admin: {
          description: 'Sobreescribe o añade Schema.org JSON-LD para esta página.',
        },
      },
    ],
    tabbedUI: true,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formOverrides: {
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
  }),
  searchPlugin({
    collections: ['posts'],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields]
      },
    },
  }),
]
