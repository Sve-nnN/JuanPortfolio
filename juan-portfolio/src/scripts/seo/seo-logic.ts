/**
 * SEO Intelligence Utilities
 * Pure functions to derive SEO metadata from keyword data.
 */

export type Intent = 'Informational' | 'Commercial' | 'Transactional'
export type FunnelStage = 'Awareness (TOFU)' | 'Consideration (MOFU)' | 'Decision (BOFU)'

/**
 * Determines search intent based on keyword modifiers.
 */
export function deriveIntent(keyword: string, currentIntent?: string): Intent {
  const kw = keyword.toLowerCase()
  if (/\b(how|tutorial|guia|guide|paso a paso|qué es|que es|conceptos|fundamentos)\b/.test(kw)) {
    return 'Informational'
  }
  if (/\b(best|top|vs|mejor|mejores|comparativa|alternativa|ranking|review)\b/.test(kw)) {
    return 'Commercial'
  }
  if (/\b(comprar|precio|price|buy|service|servicio|cotizar|contratar)\b/.test(kw)) {
    return 'Transactional'
  }
  return (currentIntent as Intent) || 'Informational'
}

/**
 * Maps intent to funnel stage.
 */
export function deriveFunnelStage(intent: Intent): FunnelStage {
  const mapping: Record<Intent, FunnelStage> = {
    Transactional: 'Decision (BOFU)',
    Commercial: 'Consideration (MOFU)',
    Informational: 'Awareness (TOFU)',
  }
  return mapping[intent]
}

/**
 * Generates unique information gain angles based on topic.
 */
export function deriveInformationGain(keyword: string): string {
  const kw = keyword.toLowerCase()
  if (/\b(seo|optimization|web)\b/.test(kw)) {
    return '• Incluiré un script de automatización en Python para validar estos puntos. • Caso de estudio real con métricas de antes/después.'
  }
  if (/\b(nextjs|react|payload|javascript|typescript|node)\b/.test(kw)) {
    return '• Ejemplo de implementación "production-ready" con repositorio de GitHub. • Comparativa de performance entre diferentes estrategias de renderizado.'
  }
  if (/\b(algoritmo|cs|estructuras|datos|base)\b/.test(kw)) {
    return '• Visualizaciones interactivas de la complejidad temporal. • Ejemplos prácticos en TypeScript aplicados a desarrollo web real.'
  }
  return '• Enfoque pragmático basado en experiencia real, no solo teoría. • Checklist descargable para implementación inmediata.'
}

/**
 * Recommends content format and cluster type.
 */
export function deriveStrategy(
  volume: number,
  difficulty: number,
  intent: Intent,
): { clusterType: 'Pillar' | 'Supporting'; recommendedFormat: string } {
  const isPillar = volume > 1000000 && difficulty > 20
  let format = 'Blog'

  if (intent === 'Informational') {
    format = isPillar ? 'Technical Guide' : 'Blog'
  } else if (intent === 'Commercial') {
    format = 'Comparison / Page'
  } else {
    format = 'Landing Page'
  }

  return {
    clusterType: isPillar ? 'Pillar' : 'Supporting',
    recommendedFormat: format,
  }
}

/**
 * Validates markdown content for SGE (Search Generative Experience) compliance.
 */
export function validateSGECompliance(content: string): {
  isValid: boolean
  errors: string[]
  score: number
} {
  const errors: string[] = []
  let score = 100

  // 1. Mandatory TL;DR / Summary (40-60 words)
  const lines = content.split('\n').filter(l => l.trim())
  const firstParagraph = lines.find(l => !l.startsWith('#') && !l.startsWith('---'))
  
  if (!firstParagraph) {
    errors.push('No summary paragraph found under H1.')
    score -= 40
  } else {
    const wordCount = firstParagraph.split(/\s+/).length
    if (wordCount < 30 || wordCount > 70) {
      errors.push(`Summary length issue: ${wordCount} words (Expected 40-60).`)
      score -= 20
    }
  }

  // 2. Direct Answers under H2s
  const headings = content.match(/^##\s+.+$/gm) || []
  if (headings.length > 0) {
    const sections = content.split(/^##\s+.+$/gm).slice(1)
    sections.forEach((section, i) => {
      const firstLine = section.trim().split('\n')[0]
      if (!firstLine || firstLine.length < 20) {
        errors.push(`Heading "${headings[i]}" missing a direct answer / definition below it.`)
        score -= 10
      }
    })
  }

  // 3. Structured Lists for Crawler Extraction
  if (!/^\s*[-*+]\s+/m.test(content) && !/^\s*\d+\.\s+/m.test(content)) {
    errors.push('No bulleted or numbered lists found. Crawlers prefer lists for AI Overviews.')
    score -= 15
  }

  return {
    isValid: errors.length === 0,
    errors,
    score: Math.max(0, score)
  }
}
