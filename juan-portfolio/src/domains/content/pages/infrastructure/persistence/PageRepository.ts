import type { Page } from 'payload-types'

export interface PageRepository {
  findById(id: string): Promise<Page | null>
  findBySlug(slug: string): Promise<Page | null>
  findAll(): Promise<Page[]>
  save(page: Page): Promise<void>
  delete(id: string): Promise<void>
}
