import type { Media } from 'payload-types'

export interface MediaRepository {
  findById(id: string): Promise<Media | null>
  findAll(): Promise<Media[]>
  save(media: Media): Promise<void>
  delete(id: string): Promise<void>
}
