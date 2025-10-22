import { CaseStudyProps } from './entity'
import { CaseStudyRepository } from './repository'

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
