/**
 * SEO Suite Plugin for Payload CMS
 * Similar to Rank Math for WordPress
 *
 * Features:
 * - Meta title & description management
 * - Automatic JSON-LD Schema generation
 * - Dynamic sitemap with change detection
 * - SEO validator & analyzer
 * - Image optimization (alt, title, dimensions)
 * - Open Graph & Twitter Cards
 * - Google Search Console & Analytics integration
 * - Noindex/nofollow controls
 * - Internal linking suggestions
 * - SEO health dashboard
 */

import type { Config } from 'payload'
import { seoFields } from './fields/seoFields'
import { generateSitemap } from './endpoints/sitemap'
import { seoAnalyzer } from './endpoints/seo-analyzer'
import { gscIntegration } from './endpoints/gsc-integration'
import { afterChangeHook } from './hooks/afterChange'
import { beforeChangeHook } from './hooks/beforeChange'

export interface SEOPluginConfig {
  /**
   * Collections to enable SEO features
   * Default: ['pages', 'posts', 'case-studies']
   */
  collections?: string[]

  /**
   * Enable automatic sitemap generation
   * Default: true
   */
  sitemap?: boolean

  /**
   * Sitemap URL path
   * Default: '/sitemap.xml'
   */
  sitemapPath?: string

  /**
   * Enable JSON-LD Schema generation
   * Default: true
   */
  jsonLd?: boolean

  /**
   * Enable image optimization (alt, title, dimensions)
   * Default: true
   */
  imageOptimization?: boolean

  /**
   * Enable SEO analyzer
   * Default: true
   */
  analyzer?: boolean

  /**
   * Google Search Console credentials
   */
  gsc?: {
    enabled: boolean
    clientEmail?: string
    privateKey?: string
    propertyUrl?: string
  }

  /**
   * Google Analytics
   */
  analytics?: {
    enabled: boolean
    measurementId?: string
  }

  /**
   * Default meta configuration
   */
  defaults?: {
    title?: string
    description?: string
    ogImage?: string
    twitterHandle?: string
  }

  /**
   * Site information for schema
   */
  site?: {
    name: string
    url: string
    logo?: string
    socialProfiles?: string[]
  }
}

export const seoPlugin =
  (pluginConfig: SEOPluginConfig = {}) =>
  (config: Config): Config => {
    const {
      collections = ['pages', 'posts', 'case-studies'],
      sitemap = true,
      sitemapPath = '/sitemap.xml',
      jsonLd = true,
      imageOptimization = true,
      analyzer = true,
      gsc = { enabled: false },
      analytics = { enabled: false },
      defaults = {},
      site = {
        name: 'My Site',
        url: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
      },
    } = pluginConfig

    return {
      ...config,
      collections: (config.collections || []).map((collection) => {
        // Add SEO fields to specified collections
        if (collections.includes(collection.slug)) {
          return {
            ...collection,
            fields: [
              ...collection.fields,
              {
                type: 'collapsible',
                label: {
                  en: 'SEO Settings',
                  es: 'Configuración SEO',
                },
                fields: seoFields({ defaults, jsonLd }),
                admin: {
                  position: 'sidebar',
                },
              },
            ],
            hooks: {
              ...collection.hooks,
              beforeChange: [
                ...(collection.hooks?.beforeChange || []),
                beforeChangeHook({ imageOptimization }),
              ],
              afterChange: [
                ...(collection.hooks?.afterChange || []),
                afterChangeHook({ sitemap, sitemapPath }),
              ],
            },
          }
        }

        // Add image optimization to Media collection
        if (collection.slug === 'media' && imageOptimization) {
          return {
            ...collection,
            hooks: {
              ...collection.hooks,
              beforeChange: [
                ...(collection.hooks?.beforeChange || []),
                async ({ data }) => {
                  // Auto-generate alt text and title if not provided
                  if (!data.alt && data.filename) {
                    data.alt = data.filename
                      .replace(/\.[^/.]+$/, '')
                      .replace(/[-_]/g, ' ')
                      .replace(/\b\w/g, (l) => l.toUpperCase())
                  }
                  if (!data.title && data.filename) {
                    data.title = data.filename
                      .replace(/\.[^/.]+$/, '')
                      .replace(/[-_]/g, ' ')
                      .replace(/\b\w/g, (l) => l.toUpperCase())
                  }
                  return data
                },
              ],
            },
          }
        }

        return collection
      }),
      endpoints: [
        ...(config.endpoints || []),
        // Sitemap endpoint
        sitemap && {
          path: sitemapPath,
          method: 'get',
          handler: generateSitemap({ collections, site }),
        },
        // SEO Analyzer endpoint
        analyzer && {
          path: '/api/seo/analyze',
          method: 'post',
          handler: seoAnalyzer,
        },
        // Google Search Console endpoints
        gsc.enabled && {
          path: '/api/seo/gsc',
          method: 'get',
          handler: gscIntegration(gsc),
        },
      ].filter(Boolean),
      globals: [
        ...(config.globals || []),
        {
          slug: 'seo-settings',
          label: {
            en: 'SEO Settings',
            es: 'Configuración SEO',
          },
          fields: [
            {
              type: 'tabs',
              tabs: [
                {
                  label: 'General',
                  fields: [
                    {
                      name: 'siteName',
                      type: 'text',
                      label: 'Site Name',
                      defaultValue: site.name,
                      required: true,
                    },
                    {
                      name: 'siteUrl',
                      type: 'text',
                      label: 'Site URL',
                      defaultValue: site.url,
                      required: true,
                    },
                    {
                      name: 'defaultTitle',
                      type: 'text',
                      label: 'Default Meta Title',
                      defaultValue: defaults.title,
                    },
                    {
                      name: 'defaultDescription',
                      type: 'textarea',
                      label: 'Default Meta Description',
                      defaultValue: defaults.description,
                    },
                    {
                      name: 'logo',
                      type: 'upload',
                      relationTo: 'media',
                      label: 'Site Logo',
                    },
                  ],
                },
                {
                  label: 'Social Media',
                  fields: [
                    {
                      name: 'twitterHandle',
                      type: 'text',
                      label: 'Twitter Handle',
                      defaultValue: defaults.twitterHandle,
                    },
                    {
                      name: 'facebookAppId',
                      type: 'text',
                      label: 'Facebook App ID',
                    },
                    {
                      name: 'socialProfiles',
                      type: 'array',
                      label: 'Social Profiles',
                      fields: [
                        {
                          name: 'platform',
                          type: 'select',
                          options: [
                            'facebook',
                            'twitter',
                            'instagram',
                            'linkedin',
                            'youtube',
                            'github',
                          ],
                        },
                        {
                          name: 'url',
                          type: 'text',
                          required: true,
                        },
                      ],
                    },
                  ],
                },
                {
                  label: 'Analytics',
                  fields: [
                    {
                      name: 'googleAnalytics',
                      type: 'group',
                      fields: [
                        {
                          name: 'enabled',
                          type: 'checkbox',
                          label: 'Enable Google Analytics',
                          defaultValue: analytics.enabled,
                        },
                        {
                          name: 'measurementId',
                          type: 'text',
                          label: 'Measurement ID (G-XXXXXXXXXX)',
                          defaultValue: analytics.measurementId,
                          admin: {
                            condition: (_, siblingData) => siblingData?.enabled,
                          },
                        },
                      ],
                    },
                    {
                      name: 'googleSearchConsole',
                      type: 'group',
                      fields: [
                        {
                          name: 'enabled',
                          type: 'checkbox',
                          label: 'Enable Google Search Console',
                          defaultValue: gsc.enabled,
                        },
                        {
                          name: 'verificationCode',
                          type: 'text',
                          label: 'Verification Code',
                          admin: {
                            condition: (_, siblingData) => siblingData?.enabled,
                          },
                        },
                      ],
                    },
                  ],
                },
                {
                  label: 'Sitemap',
                  fields: [
                    {
                      name: 'sitemapEnabled',
                      type: 'checkbox',
                      label: 'Enable Sitemap',
                      defaultValue: sitemap,
                    },
                    {
                      name: 'sitemapPath',
                      type: 'text',
                      label: 'Sitemap Path',
                      defaultValue: sitemapPath,
                    },
                    {
                      name: 'excludeFromSitemap',
                      type: 'array',
                      label: 'Exclude from Sitemap',
                      fields: [
                        {
                          name: 'slug',
                          type: 'text',
                          label: 'Page Slug',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
          access: {
            read: () => true,
          },
        },
      ],
    }
  }

export default seoPlugin
