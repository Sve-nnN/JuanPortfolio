import { withPayload } from '@payloadcms/next/withPayload'
import redirectsLocal from './redirects.json' with { type: 'json' }

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.__NEXT_PRIVATE_ORIGIN || 'http://localhost:3000'

const nextConfig = {
  redirects: async () => {
    const internetExplorerRedirect = {
      destination: '/ie-incompatible.html',
      has: [
        {
          type: 'header',
          key: 'user-agent',
          value: '(.*Trident.*)', // all ie browsers
        },
      ],
      permanent: false,
      source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
    }

    const sitemapRedirect = {
      source: '/sitemap.html',
      destination: '/sitemap',
      permanent: true,
    }

    const singularSitemapRedirects = [
      {
        source: '/category-sitemap.xml',
        destination: '/categories-sitemap.xml',
        permanent: true,
      },
      {
        source: '/author-sitemap.xml',
        destination: '/authors-sitemap.xml',
        permanent: true,
      },
    ]

    // Legacy /posts/* URLs → /blog/* (permanent 301)
    const postsRedirects = [
      { source: '/posts/:path*', destination: '/blog/:path*', permanent: true },
      { source: '/en/posts/:path*', destination: '/en/blog/:path*', permanent: true },
    ]

    return [
      ...(redirectsLocal || []),
      internetExplorerRedirect,
      sitemapRedirect,
      ...singularSitemapRedirects,
      ...postsRedirects,
    ]
  },
  images: {
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL /* 'https://example.com' */].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', ''),
        }
      }),
      // Common external hosts used by the project (seed images, avatars, etc.)
      {
        protocol: 'https',
        hostname: 'juan-tech.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.juanes.xyz',
      },
      {
        protocol: 'https',
        hostname: 'www.gravatar.com',
      },
      {
        // Vercel Blob storage — production media uploads
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Performance optimizations
  reactStrictMode: true,
  compress: true, // Enable gzip compression

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react'],
    optimizeCss: true,
  },

  // Modularize imports to reduce bundle size
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
      preventFullImport: true,
    },
  },

  sassOptions: {
    silenceDeprecations: ['legacy-js-api', 'import'],
  },

  headers: async () => {
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://www.googletagmanager.com https://challenges.cloudflare.com https://analytics.ahrefs.com https://static.cloudflareinsights.com https://assets.calendly.com;
      connect-src 'self' https://juan-tech.com http://localhost:3000 https://va.vercel-scripts.com https://vitals.vercel-analytics.com https://www.google-analytics.com https://region1.google-analytics.com https://cloudflareinsights.com https://calendly.com;
      style-src 'self' 'unsafe-inline' https://assets.calendly.com;
      img-src 'self' blob: data: https://juan-tech.com https://res.cloudinary.com https://raw.githubusercontent.com https://lh3.googleusercontent.com https://cdn.juanes.xyz https://www.gravatar.com https://www.googletagmanager.com https://www.google-analytics.com https://*.public.blob.vercel-storage.com https://calendly.com https://assets.calendly.com;
      font-src 'self' data:;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'self';
      frame-src 'self' https://challenges.cloudflare.com https://calendly.com;
      upgrade-insecure-requests;
    `

    return [
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'http://localhost:3000' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\s{2,}/g, ' ').trim(),
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
