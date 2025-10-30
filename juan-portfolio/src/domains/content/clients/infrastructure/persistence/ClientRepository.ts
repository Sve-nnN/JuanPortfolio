import type { Client } from 'payload-types'

export interface ClientRepository {
  findById(id: string): Promise<Client | null>
  findAll(): Promise<Client[]>
  save(client: Client): Promise<void>
  delete(id: string): Promise<void>
}
