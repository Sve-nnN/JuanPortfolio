import { describe, test, expect } from 'vitest'
import { CaseStudy } from '../../src/domain/caseStudy/entity'
import { InMemoryCaseStudyRepository } from '../../src/domain/caseStudy/repository'
import { CreateCaseStudy, ListCaseStudies } from '../../src/domain/caseStudy/use-cases'

describe('CaseStudy entity', () => {
  test('creates with valid title', () => {
    const cs = new CaseStudy({ title: 'Test' })
    expect(cs.title).toBe('Test')
    expect(Array.isArray(cs.tags)).toBe(true)
  })

  test('throws when title is empty', () => {
    expect(() => new CaseStudy({ title: '' })).toThrow('CaseStudy must have a title')
  })
})

describe('CaseStudy repository and use-cases', () => {
  test('create and retrieve', async () => {
    const repo = new InMemoryCaseStudyRepository()
    const create = new CreateCaseStudy(repo)
    const list = new ListCaseStudies(repo)

    const created = await create.execute({ title: 'CS 1', excerpt: 'x' })
    expect(created.id).toBeDefined()
    const all = await list.execute()
    expect(all.length).toBe(1)
    expect(all[0].title).toBe('CS 1')
  })

  test('findById returns null when not found', async () => {
    const repo = new InMemoryCaseStudyRepository()
    const found = await repo.findById('nope')
    expect(found).toBeNull()
  })
})
