import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { NormalizedAuthor } from '@/utilities/resolvePostAuthors'
import { cn } from '@/utilities/ui'

export interface AuthorCardProps {
  // Accepts the normalized author shape so the card renders identically whether
  // the source is postAuthors (Authors) or the legacy authors→users fallback.
  author: Pick<NormalizedAuthor, 'name' | 'jobTitle' | 'bio' | 'avatar' | 'slug' | 'socialMedia'>
  className?: string
}

/**
 * Author Card component for E-E-A-T attribution
 * Displays at the end of blog posts to establish authorship and expertise
 */
export const AuthorCard: React.FC<AuthorCardProps> = ({ author, className }) => {
  const avatarUrl =
    author.avatar && typeof author.avatar === 'object' && 'url' in author.avatar
      ? (author.avatar.url as string)
      : null

  const authorUrl = author.slug ? `/authors/${author.slug}` : null

  const socialLinks = []
  if (author.socialMedia?.linkedin) {
    socialLinks.push({ name: 'LinkedIn', url: author.socialMedia.linkedin, icon: 'linkedin' })
  }
  if (author.socialMedia?.github) {
    socialLinks.push({ name: 'GitHub', url: author.socialMedia.github, icon: 'github' })
  }
  if (author.socialMedia?.twitter) {
    socialLinks.push({ name: 'Twitter', url: author.socialMedia.twitter, icon: 'twitter' })
  }

  return (
    <aside
      className={cn(
        'border-t border-border pt-8 mt-12',
        'bg-muted/30 rounded-lg p-6',
        className,
      )}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        {avatarUrl && (
          <div className="flex-shrink-0">
            {authorUrl ? (
              <Link href={authorUrl} className="block">
                <Image
                  src={avatarUrl}
                  alt={author.name || 'Author'}
                  width={80}
                  height={80}
                  unoptimized
                  className="rounded-full object-cover"
                />
              </Link>
            ) : (
              <Image
                src={avatarUrl}
                alt={author.name || 'Author'}
                width={80}
                height={80}
                unoptimized
                className="rounded-full object-cover"
              />
            )}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <h3 className="text-lg font-semibold">
              {authorUrl ? (
                <Link href={authorUrl} className="hover:underline">
                  {author.name}
                </Link>
              ) : (
                author.name
              )}
            </h3>
            {author.jobTitle && <p className="text-sm text-muted-foreground">{author.jobTitle}</p>}
          </div>

          {/* Bio excerpt (first 2 lines) */}
          {author.bio && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{author.bio}</p>
          )}

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-3 mb-2">
              {socialLinks.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={link.name}
                >
                  <span className="sr-only">{link.name}</span>
                  {link.icon === 'linkedin' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  )}
                  {link.icon === 'github' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  )}
                  {link.icon === 'twitter' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  )}
                </a>
              ))}
            </div>
          )}

          {/* View all posts link */}
          {authorUrl && (
            <Link
              href={authorUrl}
              className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              Ver todos los posts
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </aside>
  )
}
