import { describe, it, expect } from 'vitest'
import { 
  deriveIntent, 
  deriveFunnelStage, 
  deriveInformationGain, 
  deriveStrategy 
} from '../../../src/scripts/seo/seo-logic'

describe('SEO Logic Utilities', () => {
  describe('deriveIntent', () => {
    it('should identify Informational intent', () => {
      expect(deriveIntent('qué es technical seo')).toBe('Informational')
      expect(deriveIntent('tutorial de nextjs')).toBe('Informational')
    })

    it('should identify Commercial intent', () => {
      expect(deriveIntent('payloadcms vs strapi')).toBe('Commercial')
      expect(deriveIntent('mejores frameworks de node')).toBe('Commercial')
    })

    it('should identify Transactional intent', () => {
      expect(deriveIntent('comprar consultoría seo')).toBe('Transactional')
      expect(deriveIntent('seo services price')).toBe('Transactional')
    })

    it('should return default intent if no modifiers match', () => {
      expect(deriveIntent('javascript stuff')).toBe('Informational')
    })
  })

  describe('deriveFunnelStage', () => {
    it('should map intent to correct funnel stage', () => {
      expect(deriveFunnelStage('Informational')).toBe('Awareness (TOFU)')
      expect(deriveFunnelStage('Commercial')).toBe('Consideration (MOFU)')
      expect(deriveFunnelStage('Transactional')).toBe('Decision (BOFU)')
    })
  })

  describe('deriveInformationGain', () => {
    it('should provide specific angles for technical topics', () => {
      const gain = deriveInformationGain('nextjs performance')
      expect(gain).toContain('repositorio de GitHub')
      expect(gain).toContain('performance')
    })

    it('should provide specific angles for SEO topics', () => {
      const gain = deriveInformationGain('seo optimization')
      expect(gain).toContain('script de automatización')
    })

    it('should provide a general pragmatic angle for other topics', () => {
      const gain = deriveInformationGain('marketing digital')
      expect(gain).toContain('Checklist descargable')
    })
  })

  describe('deriveStrategy', () => {
    it('should recommend Pillar strategy for high volume/difficulty', () => {
      const strategy = deriveStrategy(1500000, 30, 'Informational')
      expect(strategy.clusterType).toBe('Pillar')
      expect(strategy.recommendedFormat).toBe('Technical Guide')
    })

    it('should recommend Supporting strategy for lower volume', () => {
      const strategy = deriveStrategy(5000, 10, 'Informational')
      expect(strategy.clusterType).toBe('Supporting')
      expect(strategy.recommendedFormat).toBe('Blog')
    })
  })
})
