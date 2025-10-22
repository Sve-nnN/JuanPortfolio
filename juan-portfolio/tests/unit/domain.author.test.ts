import { describe, test, expect } from 'vitest'
import { Author } from '../../src/domain/author/entity'
import { InMemoryAuthorRepository } from '../../src/domain/author/repository'
import { CreateAuthor, ListAuthors } from '../../src/domain/author/use-cases'

describe('Author entity', () => {
  test('creates with valid name', () => {
    const a = new Author({ name: 'Alice' })
    expect(a.name).toBe('Alice')
  })

  test('throws when name is empty', () => {
    expect(() => new Author({ name: '' })).toThrow('Author must have a name')
  })
})

describe('Author repository and use-cases', () => {
  test('create and list authors', async () => {
    const repo = new InMemoryAuthorRepository()
    const create = new CreateAuthor(repo)
    const list = new ListAuthors(repo)

    const c = await create.execute({ name: 'Bob', role: 'Dev' })
    expect(c.id).toBeDefined()
    const all = await list.execute()
    expect(all.length).toBe(1)
    expect(all[0].role).toBe('Dev')
  })

  test('findById returns null when missing', async () => {
    const repo = new InMemoryAuthorRepository()
    const found = await repo.findById('missing')
    expect(found).toBeNull()
  })
})
