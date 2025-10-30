import type { CaseStudy } from 'payload-types'

export interface CaseStudyRepository {
  findById(id: string): Promise<CaseStudy | null>
  findBySlug(slug: string): Promise<CaseStudy | null>
  findAll(): Promise<CaseStudy[]>
  save(caseStudy: CaseStudy): Promise<void>
  delete(id: string): Promise<void>
}
