import { CaseStudyProps } from '../domain/CaseStudyEntity'
import { CaseStudyRepository } from '../infrastructure/persistence/CaseStudyRepositoryImpl'

export class CreateCaseStudy {
  constructor(private repo: CaseStudyRepository) {}

  async execute(data: CaseStudyProps) {
    return this.repo.create(data)
  }
}

export class ListCaseStudies {
  constructor(private repo: CaseStudyRepository) {}

  async execute() {
    return this.repo.findAll()
  }
}
