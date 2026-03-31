export type Locale = 'en' | 'es'

export interface FileState {
  id: string
  slug: string
  locale: Locale
  lastLocalHash: string
  lastRemoteUpdatedAt: string
}

export interface SyncState {
  files: Record<string, FileState>
}

export interface PostFrontmatter {
  title?: string
  slug?: string
  /** Legacy locale field — use `locale` in FileState; kept for frontmatter parsing */
  idioma?: Locale
  publishedAt?: string
  updatedAt?: string
  authors?: string[]
  categories?: string[]
  categoryTitle?: string
  primary_keywords?: string[]
  semantic_keywords?: string[]
  metaTitle?: string
  metaDescription?: string
  status?: string
  uploaded?: boolean
  tldr?: string
  noindex?: boolean
}

export interface ParsedPost {
  slug: string
  locale: Locale
  title: string
  body: string
  tldr?: string
  frontmatter: PostFrontmatter
}

export interface ResolvedIds {
  primaryKeywordId?: string
  semanticKeywordIds: string[]
  authorIds: string[]
  categoryIds: string[]
}

export interface PayloadPostData {
  title: string
  slug: string
  content: {
    tldr?: string
    content: unknown
  }
  primaryKeyword: string | undefined
  semanticKeywords: string[]
  publishedAt: string
  _status: string
  meta: {
    title: string | undefined
    description: string | undefined
    noindex?: boolean
  }
  authors: string[]
  categories: string[]
}
