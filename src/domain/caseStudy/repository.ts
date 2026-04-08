import { CaseStudy, CaseStudyProps } from './entity'

export interface CaseStudyRepository {
  create(data: CaseStudyProps): Promise<CaseStudy>
  findById(id: string): Promise<CaseStudy | null>
  findAll(): Promise<CaseStudy[]>
}

export class InMemoryCaseStudyRepository implements CaseStudyRepository {
  private store: Map<string, CaseStudy> = new Map()
  private idSeq = 1

  async create(data: CaseStudyProps) {
    const id = data.id ?? String(this.idSeq++)
    const cs = new CaseStudy({ ...data, id })
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
