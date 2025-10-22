import { describe, test, expect } from 'vitest'

import { WorkCards } from '../../src/blocks/WorkCards/config'
import { ClientsCarousel } from '../../src/blocks/ClientsCarousel/config'
import { Intro } from '../../src/blocks/Intro/config'

describe('Block configs exist', () => {
  test('WorkCards block exported', () => {
    expect(WorkCards).toBeDefined()
    expect(WorkCards.slug).toBe('workCards')
  })

  test('ClientsCarousel block exported', () => {
    expect(ClientsCarousel).toBeDefined()
    expect(ClientsCarousel.slug).toBe('clientsCarousel')
  })

  test('Intro block exported', () => {
    expect(Intro).toBeDefined()
    expect(Intro.slug).toBe('intro')
  })
})
