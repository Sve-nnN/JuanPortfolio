import type { Locale, PayloadPostData } from './types'

interface PayloadClient {
  find: (args: Record<string, unknown>) => Promise<{ docs: Array<Record<string, unknown>> }>
  findByID: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
  create: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
  update: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
}

/**
 * Repository pattern: encapsulates all Payload CMS data-access operations,
 * keeping business logic in ContentSyncManager free of SDK details.
 */
export class PayloadRepository {
  constructor(private readonly payload: PayloadClient) {}

  // --- Generic resolver (Strategy: all resolver calls share the same logic) ---

  async resolveByField(
    collection: string,
    field: string,
    value: string,
  ): Promise<string | null> {
    try {
      const found = await this.payload.find({
        collection,
        where: { [field]: { equals: value } },
        limit: 1,
      })
      return (found.docs[0]?.id as string) ?? null
    } catch {
      return null
    }
  }

  async resolveKeyword(keyword: string): Promise<string | null> {
    return this.resolveByField('keyword-metrics', 'keyword', keyword)
  }

  async resolveAuthor(slug: string): Promise<string | null> {
    return this.resolveByField('users', 'slug', slug)
  }

  async resolveCategory(slug: string): Promise<string | null> {
    return this.resolveByField('categories', 'slug', slug)
  }

  async resolveCategoryByTitle(title: string): Promise<string | null> {
    return this.resolveByField('categories', 'title', title)
  }

  // --- Post CRUD ---

  async findPostBySlug(slug: string): Promise<{ id: string; updatedAt: string } | null> {
    const found = await this.payload.find({
      collection: 'posts',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    const doc = found.docs[0]
    if (!doc) return null
    return { id: doc.id as string, updatedAt: doc.updatedAt as string }
  }

  async getPost(id: string, locale: Locale): Promise<Record<string, unknown>> {
    return this.payload.findByID({ collection: 'posts', id, locale })
  }

  async createPost(data: PayloadPostData, locale: Locale): Promise<Record<string, unknown>> {
    return this.payload.create({
      collection: 'posts',
      data,
      locale,
      context: { disableRevalidate: true },
    })
  }

  async updatePost(
    id: string,
    data: PayloadPostData,
    locale: Locale,
  ): Promise<Record<string, unknown>> {
    return this.payload.update({
      collection: 'posts',
      id,
      data,
      locale,
      context: { disableRevalidate: true },
    })
  }
}
