import { describe, it, expect } from 'vitest'
import { extractPhrases } from '../../../src/scripts/seo/keyword-utils'

describe('Keyword Gap Algorithm (extractPhrases)', () => {
  it('should extract valid long-tail technical phrases', () => {
    const text = 'Learn how to implement nextjs seo optimization for your production apps'
    const phrases = extractPhrases(text)
    
    // Should extract phrases like "nextjs seo optimization"
    expect(phrases).toContain('nextjs seo optimization')
  })

  it('should filter out phrases starting or ending with stop words', () => {
    const text = 'the technical seo guide for developers'
    const phrases = extractPhrases(text)
    
    // "the technical seo" starts with 'the' -> skip
    // "technical seo guide" -> valid
    // "seo guide for" ends with 'for' -> skip
    expect(phrases).not.toContain('the technical seo')
    expect(phrases).toContain('technical seo guide')
  })

  it('should exclude UI noise and accessibility text', () => {
    const text = 'Skip to main content. Search documentation. Was this page helpful? English Deutsch Español.'
    const phrases = extractPhrases(text)
    
    expect(phrases.length).toBe(0)
  })

  it('should handle Spanish technical terms and accents', () => {
    const text = 'Guía completa de configuración de bases de datos relacionales'
    const phrases = extractPhrases(text)
    
    // "completa de configuración de bases" -> valid (starts with 'completa', ends with 'bases')
    expect(phrases).toContain('completa de configuración de bases')
    // "configuración de bases de datos" -> valid (starts with 'configuración', ends with 'datos')
    expect(phrases).toContain('configuración de bases de datos')
  })

  it('should ignore single words or phrases shorter than 3 words (unless boosted)', () => {
    const text = 'simple post top content view more'
    const phrases = extractPhrases(text)
    
    expect(phrases.length).toBe(0)
  })

  it('should boost phrases with intent modifiers even if they are 3 words', () => {
    const text = 'the best nextjs tutorial'
    const phrases = extractPhrases(text)
    
    // "best nextjs tutorial" -> valid (starts with booster 'best', ends with booster 'tutorial' - which is NOT a stop word now)
    expect(phrases).toContain('best nextjs tutorial')
  })

  it('should filter out code-like content (json, application/ld, etc.)', () => {
    const text = 'script type application ld json content'
    const phrases = extractPhrases(text)
    
    expect(phrases.length).toBe(0)
  })

  it('should handle empty or null input gracefully', () => {
    expect(extractPhrases('')).toEqual([])
    expect(extractPhrases(null as any)).toEqual([])
  })
})
