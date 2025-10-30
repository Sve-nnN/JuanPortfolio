import type { Testimonial } from 'payload-types'

export interface TestimonialRepository {
  findById(id: string): Promise<Testimonial | null>
  findAll(): Promise<Testimonial[]>
  save(testimonial: Testimonial): Promise<void>
  delete(id: string): Promise<void>
}
