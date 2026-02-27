import { Metadata } from 'next'
import React from 'react'
import configPromise from '@payload-config'
import { Media } from '@/components/Media'
import { getPayload } from 'payload'
import { Card } from '@/components/Card'
import { generatePersonSchema } from '@/utilities/schema/generatePersonSchema'
import { mergeSchemas } from '@/utilities/schema/mergeSchemas'
import Script from 'next/script'
import { Calendar, Building, GraduationCap, Briefcase } from 'lucide-react'
import { generateMeta } from '@/utilities/generateMeta'

type Props = {
  params: Promise<{ slug: string, locale: string }>
}

const queryUserBySlug = async (slug: string, locale?: 'en' | 'es') => {
  const payload = await getPayload({ config: configPromise })
  let res = await payload.find({
    collection: 'users',
    limit: 1,
    where: { slug: { equals: slug } },
    pagination: false,
    depth: 2,
    locale,
  })
  if (!res.docs?.[0]) {
    res = await payload.find({
      collection: 'users',
      limit: 1,
      where: { id: { equals: slug } },
      pagination: false,
      depth: 2,
      locale,
    })
  }
  return res.docs?.[0] || null
}

const queryPostsByAuthor = async (authorId: string, locale?: 'en' | 'es') => {
  const payload = await getPayload({ config: configPromise })
  const res = await payload.find({
    collection: 'posts',
    limit: 50,
    where: {
      authors: { contains: authorId },
      _status: { equals: 'published' },
    },
    sort: '-publishedAt',
    locale,
  })
  return res.docs || []
}

export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string, locale: string }>
}): Promise<Metadata> {
  const { slug, locale: rawLocale } = await paramsPromise
  const locale = (['en', 'es'].includes(rawLocale) ? rawLocale : 'es') as 'en' | 'es'
  const user = await queryUserBySlug(slug, locale)

  if (!user) {
    return {
      title: locale === 'es' ? 'Autor no encontrado' : 'Author not found',
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return generateMeta({ doc: user as any, locale, path: `/authors/${slug}` })
}

export default async function AuthorPage({ params: paramsPromise }: Props) {
  const { slug = '', locale: rawLocale } = await paramsPromise
  const locale = (['en', 'es'].includes(rawLocale) ? rawLocale : 'es') as 'en' | 'es'
  const localePrefix = locale === 'es' ? '' : '/en'

  if (!slug) return <p className="container py-24 text-center">{locale === 'es' ? 'Autor no encontrado' : 'Author not found'}</p>
  const user = await queryUserBySlug(slug, locale)
  if (!user) return <p className="container py-24 text-center">{locale === 'es' ? 'Autor no encontrado' : 'Author not found'}</p>

  const posts = await queryPostsByAuthor(user.id, locale)

  // Generate Person schema for E-E-A-T
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || ''
  const authorUrl = `${baseUrl}${localePrefix}/authors/${user.slug}`

  // Get avatar URL from cloudinaryUrl or fallback to url
  const avatarUrl =
    user.avatar && typeof user.avatar === 'object'
      ? (user.avatar.cloudinaryUrl as string | undefined) || (user.avatar.url as string | undefined)
      : undefined

  const socialLinks: string[] = []
  if (user.socialMedia?.linkedin) socialLinks.push(user.socialMedia.linkedin)
  if (user.socialMedia?.github) socialLinks.push(user.socialMedia.github)
  if (user.socialMedia?.twitter) socialLinks.push(user.socialMedia.twitter)
  if (user.socialMedia?.website) socialLinks.push(user.socialMedia.website)

  const expertise = user.expertise?.map((e) => (typeof e === 'object' ? e.topic : e)).filter(Boolean) || []

  // Map education for schema
  const alumniOf = user.education?.map(edu => ({
    name: edu.institution || 'Unknown Institution',
    degree: edu.degree,
  })).filter(edu => edu.name && edu.degree) || []

  const personSchema = generatePersonSchema({
    name: user.name || '',
    jobTitle: user.jobTitle || undefined,
    description: user.bio || undefined,
    image: avatarUrl,
    url: authorUrl,
    sameAs: socialLinks,
    knowsAbout: expertise as string[],
    alumniOf,
  })

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: locale === 'es' ? 'Inicio' : 'Home',
        item: `${baseUrl}${localePrefix}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: locale === 'es' ? 'Autores' : 'Authors',
        item: `${baseUrl}${localePrefix}/authors`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: user.name,
        item: authorUrl,
      },
    ],
  }

  const combinedSchema = mergeSchemas([personSchema, breadcrumbSchema])

  return (
    <>
      <Script
        id="author-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(combinedSchema),
        }}
      />
      <main className="bg-background">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 bg-gradient-to-br from-muted/50 to-muted/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              {/* Avatar */}
              {user.avatar && typeof user.avatar === 'object' && (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden mx-auto mb-6 ring-4 ring-background shadow-xl">
                  <Media
                    resource={user.avatar}
                    width={160}
                    height={160}
                    imgClassName="object-cover w-full h-full"
                    htmlElement={null}
                  />
                </div>
              )}

              {/* Name & Title */}
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-3">{user.name}</h1>
              {user.jobTitle && (
                <p className="text-xl md:text-2xl text-muted-foreground mb-6">{user.jobTitle}</p>
              )}

              {/* Bio */}
              {user.bio && (
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
                  {user.bio}
                </p>
              )}

              {/* Social Links */}
              {socialLinks.length > 0 && (
                <div className="flex items-center justify-center gap-4 mb-8">
                  {user.socialMedia?.linkedin && (
                    <a
                      href={user.socialMedia.linkedin}
                      target="_blank"
                      rel="noopener noreferrer me"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-background hover:bg-muted rounded-lg transition-colors"
                      aria-label="LinkedIn"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                      LinkedIn
                    </a>
                  )}
                  {user.socialMedia?.github && (
                    <a
                      href={user.socialMedia.github}
                      target="_blank"
                      rel="noopener noreferrer me"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-background hover:bg-muted rounded-lg transition-colors"
                      aria-label="GitHub"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      GitHub
                    </a>
                  )}
                  {user.socialMedia?.twitter && (
                    <a
                      href={user.socialMedia.twitter}
                      target="_blank"
                      rel="noopener noreferrer me"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-background hover:bg-muted rounded-lg transition-colors"
                      aria-label="Twitter"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      Twitter
                    </a>
                  )}
                  {user.socialMedia?.website && (
                    <a
                      href={user.socialMedia.website}
                      target="_blank"
                      rel="noopener noreferrer me"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-background hover:bg-muted rounded-lg transition-colors"
                      aria-label="Website"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                        />
                      </svg>
                      Website
                    </a>
                  )}
                </div>
              )}

              {/* Expertise Tags */}
              {expertise.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {expertise.map((topic, i) => (
                    <span
                      key={i}
                      className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              {/* Experience Timeline */}
              {user.experience && user.experience.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl md:text-3xl font-display font-bold mb-6">
                    {locale === 'es' ? 'Experiencia Profesional' : 'Professional Experience'}
                  </h2>
                  <div className="space-y-0">
                    {user.experience.map((exp, i) => (
                      <div
                        key={i}
                        className="relative pl-8 pb-8 border-l-2 border-muted last:pb-0"
                      >
                        {/* Timeline dot - aligned with card top */}
                        <div className="absolute left-0 top-2 w-4 h-4 -ml-[9px] rounded-full bg-primary ring-4 ring-background" />

                        <div className="bg-card rounded-lg p-6 shadow-sm">
                          <div className="flex items-start gap-2 mb-1">
                            <Briefcase className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <h3 className="text-xl font-semibold flex-1">
                              {exp.role} — {exp.company}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3 ml-7">
                            <Calendar className="w-4 h-4" />
                            <p>
                              {exp.startDate ? new Date(exp.startDate).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long' }) : ''}
                              {' — '}
                              {exp.endDate ? new Date(exp.endDate).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long' }) : (locale === 'es' ? 'Presente' : 'Present')}
                            </p>
                          </div>
                          {exp.description && (
                            <p className="text-muted-foreground ml-7">{exp.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education Timeline */}
              {user.education && user.education.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl md:text-3xl font-display font-bold mb-6">
                    {locale === 'es' ? 'Educación y Certificaciones' : 'Education and Certifications'}
                  </h2>
                  <div className="space-y-0">
                    {user.education.map((edu, i) => {
                      // Keep cert URL only for the <a href> link
                      const certUrl = edu.certificate && typeof edu.certificate === 'object'
                        ? (edu.certificate.cloudinaryUrl as string | undefined) || (edu.certificate.url as string | undefined)
                        : null
                      
                      return (
                        <div
                          key={i}
                          className="relative pl-8 pb-8 border-l-2 border-muted last:pb-0"
                        >
                          {/* Timeline dot - aligned with card top */}
                          <div className="absolute left-0 top-2 w-4 h-4 -ml-[9px] rounded-full bg-primary ring-4 ring-background" />

                          <div className="bg-card rounded-lg p-6 shadow-sm">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex-1">
                                <div className="flex items-start gap-2 mb-2">
                                  <GraduationCap className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                  <h3 className="text-xl font-semibold flex-1">{edu.degree}</h3>
                                </div>
                                {edu.institution && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <Building className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    <p className="text-base text-muted-foreground flex items-center gap-2">
                                      {edu.institution}
                                      {edu.logo && typeof edu.logo === 'object' && (
                                        <Media
                                          resource={edu.logo}
                                          width={20}
                                          height={20}
                                          imgClassName="inline-block object-contain"
                                          htmlElement={null}
                                        />
                                      )}
                                    </p>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                  <Calendar className="w-4 h-4" />
                                  <p>
                                    {edu.startDate ? new Date(edu.startDate).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long' }) : ''}
                                    {edu.startDate && edu.endDate && ' — '}
                                    {edu.startDate && !edu.endDate && ' — '}
                                    {edu.endDate ? new Date(edu.endDate).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long' }) : (edu.startDate ? (locale === 'es' ? 'Presente' : 'Present') : '')}
                                  </p>
                                </div>
                              </div>
                              {certUrl && edu.certificate && typeof edu.certificate === 'object' && (
                                <a
                                  href={certUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-shrink-0"
                                  aria-label={locale === 'es' ? `Ver certificado de ${edu.degree}` : `View ${edu.degree} certificate`}
                                >
                                  <Media
                                    resource={edu.certificate}
                                    width={120}
                                    height={120}
                                    imgClassName="rounded-lg object-cover border-2 border-border hover:border-primary transition-colors"
                                    htmlElement={null}
                                  />
                                </a>
                              )}
                            </div>
                            {edu.description && (
                              <p className="text-muted-foreground">{edu.description}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Published Articles */}
              <div>
                <h2 className="text-2xl md:text-3xl font-display font-bold mb-6">
                  {locale === 'es' ? `Artículos Publicados (${posts.length})` : `Published Articles (${posts.length})`}
                </h2>
                {posts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {posts.map((post) => (
                      <Card key={post.id} doc={post} relationTo="posts" showCategories={true} locale={locale} />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    {locale === 'es' ? 'Aún no hay artículos publicados por este autor.' : 'No articles published by this author yet.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
