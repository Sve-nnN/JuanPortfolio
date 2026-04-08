import type { Post } from 'payload-types'

export interface PostRepository {
  findById(id: string): Promise<Post | null>
  findBySlug(slug: string): Promise<Post | null>
  findAll(): Promise<Post[]>
  save(post: Post): Promise<void>
  delete(id: string): Promise<void>
}
