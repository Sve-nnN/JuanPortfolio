import type { Category } from 'payload-types'

export interface CategoryRepository {
  findById(id: string): Promise<Category | null>
  findBySlug(slug: string): Promise<Category | null>
  findAll(): Promise<Category[]>
  save(category: Category): Promise<void>
  delete(id: string): Promise<void>
}
