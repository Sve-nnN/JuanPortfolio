import type { AdBanner } from 'payload-types'

export interface AdBannerRepository {
  findById(id: string): Promise<AdBanner | null>
  findAll(): Promise<AdBanner[]>
  save(adBanner: AdBanner): Promise<void>
  delete(id: string): Promise<void>
}