import type { GlobalConfig } from 'payload'
import { ListingHero } from '@/blocks/ListingHero/config'
import { CaseStudiesGrid } from '@/blocks/CaseStudiesGrid/config'
import { LatestCaseStudies } from '@/blocks/LatestCaseStudies/config'
import { ADMIN_GROUP } from '@/utilities/adminGroups'

export const CaseStudiesListing: GlobalConfig = {
  slug: 'case-studies-listing',
  admin: {
    group: ADMIN_GROUP.CONTENIDO,
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'description', type: 'textarea', localized: true },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [ListingHero, CaseStudiesGrid, LatestCaseStudies],
      admin: {
        description: 'Bloques personalizables para la página de casos de estudio',
      },
    },
  ],
}
