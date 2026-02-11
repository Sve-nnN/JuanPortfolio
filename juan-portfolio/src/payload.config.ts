import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'

import sharp from 'sharp' // sharp-import
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
// Import built-in translations
// If you want to customize admin translations, you can import them:
// import { en } from '@payloadcms/translations/languages/en'
// import { es } from '@payloadcms/translations/languages/es'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import Works from './collections/Works'
import CaseStudies from './collections/CaseStudies'
import Clientes from './collections/Clientes'
import { AdBannersCollection } from './domains/content/ad-banners/domain/AdBanner'
import Testimonials from './collections/Testimonials'
import { KeywordMetrics } from './collections/KeywordMetrics'
import { PageMetrics } from './collections/PageMetrics'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { Home } from './globals/Home/config'
import { BlogListing } from './globals/BlogListing/config'
import { CaseStudiesListing } from './globals/CaseStudiesListing/config'
import { Styles } from './globals/Styles/config'
import { SiteSettings } from './globals/SiteSettings'
import { LLM } from './globals/LLM/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import { resendAdapter } from '@payloadcms/email-resend'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      beforeLogin: ['@/components/BeforeLogin'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  // Internationalization (admin UI translations)
  // Keep only a fallback language for now. Removing `supportedLanguages`
  // avoids runtime admin errors when translation objects are not installed.
  i18n: {
    fallbackLanguage: 'en',
  },
  // Content localization (localized fields per document)
  localization: {
    locales: [
      {
        label: 'English',
        code: 'en',
      },
      {
        label: 'Español',
        code: 'es',
      },
    ],
    defaultLocale: 'es',
    fallback: true,
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  collections: [
    Pages,
    Posts,
    Media,
    Categories,
    Users,
    Works,
    CaseStudies,
    Clientes,
    AdBannersCollection,
    Testimonials,
    KeywordMetrics,
    PageMetrics,
  ],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer, Home, BlogListing, CaseStudiesListing, Styles, SiteSettings, LLM],
  plugins: [
    ...plugins,
    mcpPlugin({
      collections: {
        [Pages.slug]: {
          enabled: true,
          description: 'Website pages',
        },
        [Posts.slug]: {
          enabled: true,
          description: 'Blog posts and articles',
        },
        [Media.slug]: {
          enabled: true,
          description: 'Media assets and uploads',
        },
        [Categories.slug]: {
          enabled: true,
          description: 'Blog categories',
        },
        [Users.slug]: {
          enabled: true,
          description: 'System users and admins',
        },
        [Works.slug]: {
          enabled: true,
          description: 'Portfolio works and projects',
        },
        [CaseStudies.slug]: {
          enabled: true,
          description: 'Detailed case studies',
        },
        [Clientes.slug]: {
          enabled: true,
          description: 'Client logos and info',
        },
        [AdBannersCollection.slug]: {
          enabled: true,
          description: 'Advertising sidebar banners',
        },
        [Testimonials.slug]: {
          enabled: true,
          description: 'Customer testimonials',
        },
        [PageMetrics.slug]: {
          enabled: true,
          description: 'Core Web Vitals metrics for pages',
        },
      },
      mcp: {
        serverOptions: {
          serverInfo: {
            name: 'Juan Portfolio MCP',
            version: '1.0.0',
          },
        },
      },
    }),
    // storage-adapter-placeholder
    vercelBlobStorage({
      collections: {
        [Media.slug]: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
      enabled: !!process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
  email: resendAdapter({
    defaultFromAddress: process.env.EMAIL_FROM || 'no-reply@juan-tech.com',
    defaultFromName: process.env.EMAIL_FROM_NAME || 'JuanTech',
    apiKey: process.env.RESEND_SECRET || '',
  }),
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [],
  },
})
