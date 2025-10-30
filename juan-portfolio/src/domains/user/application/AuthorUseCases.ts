import { AuthorRepository } from '../infrastructure/persistence/AuthorRepository'

export class CreateAuthor {
  constructor(private repo: AuthorRepository) {}

  async execute(data: { name: string; role?: string; bio?: string }) {
    return this.repo.create(data)
  }
}

export class ListAuthors {
  constructor(private repo: AuthorRepository) {}

  async execute() {
    return this.repo.findAll()
  }
}
