export type CaseStudyProps = {
  id?: string
  title: string
  excerpt?: string
  tags?: string[]
}

export class CaseStudy {
  id?: string
  title: string
  excerpt?: string
  tags: string[]

  constructor(props: CaseStudyProps) {
    if (!props.title || props.title.trim() === '') {
      throw new Error('CaseStudy must have a title')
    }
    this.id = props.id
    this.title = props.title
    this.excerpt = props.excerpt
    this.tags = props.tags || []
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      excerpt: this.excerpt,
      tags: this.tags,
    }
  }
}
