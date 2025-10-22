export type AuthorProps = {
  id?: string
  name: string
  role?: string
  bio?: string
}

export class Author {
  id?: string
  name: string
  role?: string
  bio?: string

  constructor(props: AuthorProps) {
    if (!props.name || props.name.trim() === '') {
      throw new Error('Author must have a name')
    }
    this.id = props.id
    this.name = props.name
    this.role = props.role
    this.bio = props.bio
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      bio: this.bio,
    }
  }
}
