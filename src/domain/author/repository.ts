import { Author } from './entity'

export interface AuthorRepository {
  create(data: { name: string; role?: string; bio?: string }): Promise<Author>
  findById(id: string): Promise<Author | null>
  findAll(): Promise<Author[]>
}

export class InMemoryAuthorRepository implements AuthorRepository {
  private store: Map<string, Author> = new Map()
  private idSeq = 1

  async create(data: { name: string; role?: string; bio?: string }) {
    const id = String(this.idSeq++)
    const a = new Author({ id, ...data })
    this.store.set(id, a)
    return a
  }

  async findById(id: string) {
    return this.store.get(id) ?? null
  }

  async findAll() {
    return Array.from(this.store.values())
  }
}
