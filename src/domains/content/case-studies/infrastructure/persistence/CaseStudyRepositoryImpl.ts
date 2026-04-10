import { CaseStudyEntity, CaseStudyProps } from '../../domain/CaseStudyEntity'

export interface CaseStudyRepository {
  create(data: CaseStudyProps): Promise<CaseStudyEntity>
  findById(id: string): Promise<CaseStudyEntity | null>
  findAll(): Promise<CaseStudyEntity[]>
}

export class InMemoryCaseStudyRepository implements CaseStudyRepository {
  private store: Map<string, CaseStudyEntity> = new Map()
  private idSeq = 1

  async create(data: CaseStudyProps) {
    const id = data.id ?? String(this.idSeq++)
    const cs = new CaseStudyEntity({ ...data, id })
    this.store.set(id, cs)
    return cs
  }

  async findById(id: string) {
    return this.store.get(id) ?? null
  }

  async findAll() {
    return Array.from(this.store.values())
  }
}
