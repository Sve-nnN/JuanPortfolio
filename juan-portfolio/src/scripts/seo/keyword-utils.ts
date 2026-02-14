import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const STOP_WORDS = new Set([
  // English
  'how', 'to', 'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'with', 'for', 'of',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
  'did', 'but', 'by', 'if', 'then', 'else', 'which', 'who', 'what', 'where', 'when',
  'about', 'more', 'read', 'view', 'find', 'search', 'top', 'posts', 'home', 'page', 'content', 'post',
  
  // Spanish
  'de', 'la', 'el', 'en', 'un', 'una', 'con', 'por', 'para', 'su', 'al', 'lo', 'que',
  'los', 'las', 'un', 'una', 'unos', 'unas', 'del', 'al', 'si', 'no', 'o', 'y', 'e', 'u',
  'mi', 'tu', 'su', 'mis', 'tus', 'sus', 'nuestro', 'nuestra', 'esta', 'este', 'esto',
  'esa', 'ese', 'eso', 'aquel', 'aquella', 'cada', 'todo', 'todos', 'toda', 'todas',
  'hacer', 'hecho', 'hace', 'tiene', 'tienen', 'había', 'habia', 'puede', 'pueden',
  'muy', 'más', 'mas', 'pero', 'solo', 'sólo', 'ya', 'ahora', 'después', 'despues',
  'antes', 'siempre', 'nunca', 'donde', 'cuando', 'quién', 'quien', 'cual', 'cuál',
  
  // UI Noise
  'h2', 'h3', 'h4', 'div', 'class', 'span', 'li', 'ul', 'ol', 'href', 'src', 'img', 'article', 'section',
  'reddit', 'github', 'youtube', 'medium', 'pdf',
  'user', 'id', 'session', 'login', 'sign', 'up', 'click', 'here', 'thanks', 'feedback',
  'script', 'type', 'application', 'ld', 'json', 'null', 'true', 'false', 'undefined', 'object', 'array',
  'string', 'number', 'var', 'const', 'let', 'function', 'return', 'import', 'export', 'from',
  'comentarios', 'compartir', 'publicado', 'fecha', 'leer', 'ver', 'ayuda', 'política',
  'privacidad', 'cookies', 'derechos', 'reservados', 'enlace', 'puedes', 'puedo', 'decir', 'dice',
  'artículo', 'post', 'blog', 'sitio', 'web', 'página', 'contenido', 'menú', 'navegación',
  'inicia', 'sesión', 'iniciar', 'conectarse', 'suscribirse', 'suscribete', 'boletín', 'newsletter',
  'temas', 'categorías', 'buscar', 'buscar...', 'anterior', 'siguiente'
])

const TECHNICAL_TERMS = [
  'best', 'vs', 'alternative', 'comparison', 'review', 'guide', 'how', 'tutorial',
  'performance', 'optimized', 'seo', 'optimization', 'completa', 'guia', 'mejor', 'mejores',
  'rendering', 'crawling', 'indexing', 'core web vitals', 'lcp', 'cls', 'inp', 'payloadcms', 'nextjs'
]

/**
 * Heuristic to determine if a phrase is likely a valid technical keyword gap.
 */
function isValidGap(phrase: string, wordCount: number): boolean {
  const hasTechnicalTerm = TECHNICAL_TERMS.some(term => phrase.includes(term))
  
  // High value technical phrases can be 3 words
  if (hasTechnicalTerm && wordCount >= 3) return true
  
  // Otherwise require at least 4 words to reduce fluff
  return wordCount >= 4
}

/**
 * Extracts potential keywords (3-6 word phrases) from text.
 * Focuses on long-tail opportunities per the user's research method.
 */
export function extractPhrases(text: string): string[] {
  if (!text) return []
  
  // 1. Aggressive Noise Cleaning
  let cleanedBody = text
    .replace(/^.*(english|deutsch|español|fran|ais|indonesia|italiano|polski|portugu).*$/gim, '')
    .replace(/(skip to main content|jump to navigation|search documentation|was this page helpful|terms of service|privacy policy|all rights reserved)/gi, ' ')

  // 2. Clean text and tokenize
  const cleanText = cleanedBody.toLowerCase()
    .replace(/\.css-[\w-]+/g, '') 
    .replace(/\{[^}]+\}/g, '')    
    .replace(/[^\w\sáéíóúñ]/g, ' ')
    .replace(/\s+/g, ' ')
  
  const allWords = cleanText.split(' ').filter(w => w.length > 0)
  const phrases: string[] = []

  // 3. Sliding Window Phrase Extraction
  for (let i = 0; i < allWords.length; i++) {
    for (let len = 3; i + len <= allWords.length && len <= 5; len++) {
      const phraseWords = allWords.slice(i, i + len)
      
      // Safety: No digits or technical IDs
      if (phraseWords.some(w => /\d/.test(w))) continue

      // Boundaries: Cannot start or end with a stop word
      if (STOP_WORDS.has(phraseWords[0]) || STOP_WORDS.has(phraseWords[phraseWords.length - 1])) {
        continue
      }
      
      const phrase = phraseWords.join(' ')
      
      // Filter out language-only phrases
      const languages = new Set(['english', 'deutsch', 'español', 'italiano', 'polski', 'portugu', 'indonesia', 'fran', 'ais', 'japan', 'chinese', 'korean', 'russian'])
      if (phraseWords.some(w => languages.has(w))) continue

      if (isValidGap(phrase, phraseWords.length)) {
        phrases.push(phrase)
      }
    }
  }
  
  return Array.from(new Set(phrases)) // Deduplicate
}
