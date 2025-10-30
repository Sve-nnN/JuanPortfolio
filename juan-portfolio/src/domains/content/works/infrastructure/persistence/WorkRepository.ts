import type { Work } from 'payload-types'

export interface WorkRepository {
  findById(id: string): Promise<Work | null>
  findAll(): Promise<Work[]>
  save(work: Work): Promise<void>
  delete(id: string): Promise<void>
}
