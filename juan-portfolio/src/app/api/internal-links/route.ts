import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'
import * as path from 'path'
import { KeywordExtractor } from '@/scripts/internal-linking/KeywordExtractor'
import { ContentScanner } from '@/scripts/internal-linking/ContentScanner'
import type { SuggestionsResponse } from '@/types/admin/internal-links'
import { mapOpportunityToSuggestion } from './_helpers'

export async function GET(req: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const requestHeaders = await headers()

    const { user } = await payload.auth({ headers: requestHeaders })
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 })
    }

    const contentDir = process.env.CONTENT_DIR ?? path.resolve(process.cwd(), 'content')
    const extractor = new KeywordExtractor(contentDir)
    const allPosts = await extractor.loadPosts()

    const sourcePost = allPosts.find((p) => p.slug === slug)
    if (!sourcePost) {
      const response: SuggestionsResponse = { slug, locale: 'es', suggestions: [] }
      return NextResponse.json(response)
    }

    const locale = sourcePost.idioma ?? 'es'
    const sameLocalePosts = allPosts.filter(
      (p) => (p.idioma ?? 'es') === locale && p.slug !== slug,
    )

    const keywordIndex = extractor.buildIndex(sameLocalePosts)

    const scanner = new ContentScanner(keywordIndex, {
      maxLinksPerKeyword: 3,
      minWordLength: 3,
      excludePatterns: [/^```/, /^#{1,6}\s/, /^---$/, /^\s*[-*+]\s*$/],
      dryRun: true,
      verbose: false,
      semantic: {
        enabled: true,
        provider: 'auto',
        model: 'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
      },
    })

    const opportunities = scanner.scanPost(sourcePost, sameLocalePosts)
    const suggestions = opportunities
      .map(mapOpportunityToSuggestion)
      .sort((a, b) => b.confidence - a.confidence)

    const response: SuggestionsResponse = { slug, locale, suggestions }
    return NextResponse.json(response)
  } catch (error) {
    console.error('API Error in /api/internal-links:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
