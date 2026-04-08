/**
 * llm-adapters.ts — Adaptadores de LLM para generación de frontmatter
 *
 * Define una interfaz común LlmAdapter y tres implementaciones concretas:
 *   - AnthropicAdapter (claude-sonnet-4-6)
 *   - OpenAiAdapter    (gpt-4o-mini)
 *   - GeminiAdapter    (gemini-2.0-flash)
 *
 * Uso: import { createAdapter } from './create-post/llm-adapters'
 *      const adapter = createAdapter('openai')
 *      const yaml = await adapter.generateFrontmatter(prompt)
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Elimina los code fences de markdown que algunos LLMs añaden alrededor del YAML.
 * Ej: ```yaml\n---\ntitle: ...\n---\n``` → ---\ntitle: ...\n---
 */
function stripCodeFence(text: string): string {
  // 1. Intentar extraer lo que esté entre bloques de código yaml o yml
  const yamlBlockMatch = text.match(/```ya?ml\n([\s\S]*?)\n```/)
  if (yamlBlockMatch?.[1]) return yamlBlockMatch[1].trim()

  // 2. Intentar extraer lo que esté entre bloques de código genéricos
  const genericBlockMatch = text.match(/```\n?([\s\S]*?)\n?```/)
  if (genericBlockMatch?.[1]) {
    const content = genericBlockMatch[1].trim()
    if (content.includes('title:')) return content
  }

  // 3. Si no hay bloques, pero hay delimitadores ---, extraer lo de dentro
  const tripleDashMatch = text.match(/---([\s\S]*?)---/)
  if (tripleDashMatch?.[1]) return tripleDashMatch[1].trim()

  // 4. Limpieza agresiva: buscar la primera aparición de un campo conocido y la última
  const lines = text.split('\n')
  const startIdx = lines.findIndex(l => l.includes('title:') || l.includes('tldr:'))
  if (startIdx !== -1) {
    const validLines = lines.slice(startIdx).filter(l => !l.trim().startsWith('```'))
    return validLines.join('\n').trim()
  }

  return text.trim()
}

// ─── Interfaz común ───────────────────────────────────────────────────────────

export interface LlmAdapter {
  readonly providerName: string
  generateFrontmatter(prompt: string): Promise<string>
}

export type LlmProvider = 'anthropic' | 'openai' | 'gemini'

// ─── Anthropic ────────────────────────────────────────────────────────────────

export class AnthropicAdapter implements LlmAdapter {
  readonly providerName = 'anthropic'
  private readonly model = 'claude-sonnet-4-6'

  constructor(private readonly apiKey: string) {}

  async generateFrontmatter(prompt: string): Promise<string> {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: this.apiKey })
    const response = await client.messages.create({
      model: this.model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = response.content[0]?.type === 'text' ? response.content[0].text.trim() : ''
    return stripCodeFence(raw)
  }
}

// ─── OpenAI ───────────────────────────────────────────────────────────────────

export class OpenAiAdapter implements LlmAdapter {
  readonly providerName = 'openai'
  private readonly model = 'gpt-4o-mini'

  constructor(private readonly apiKey: string) {}

  async generateFrontmatter(prompt: string): Promise<string> {
    const OpenAI = (await import('openai')).default
    const client = new OpenAI({ apiKey: this.apiKey })
    const response = await client.chat.completions.create({
      model: this.model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = response.choices[0]?.message?.content?.trim() ?? ''
    return stripCodeFence(raw)
  }
}

// ─── Gemini ───────────────────────────────────────────────────────────────────

export class GeminiAdapter implements LlmAdapter {
  readonly providerName = 'gemini'
  private readonly model = 'gemini-2.0-flash'

  constructor(private readonly apiKey: string) {}

  async generateFrontmatter(prompt: string): Promise<string> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(this.apiKey)
    const model = genAI.getGenerativeModel({ model: this.model })
    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()
    return stripCodeFence(raw)
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Crea el adaptador correspondiente al proveedor indicado.
 * Lanza un error descriptivo si falta la API key requerida.
 */
export function createAdapter(provider: LlmProvider): LlmAdapter {
  switch (provider) {
    case 'anthropic': {
      const key = process.env.ANTHROPIC_API_KEY
      if (!key) {
        throw new Error(
          'ANTHROPIC_API_KEY no está definido en .env.\n' +
            'Añade: ANTHROPIC_API_KEY=sk-ant-... en tu archivo .env',
        )
      }
      return new AnthropicAdapter(key)
    }
    case 'openai': {
      const key = process.env.OPENAI_API_KEY
      if (!key) {
        throw new Error(
          'OPENAI_API_KEY no está definido en .env.\n' +
            'Añade: OPENAI_API_KEY=sk-... en tu archivo .env',
        )
      }
      return new OpenAiAdapter(key)
    }
    case 'gemini': {
      const key = process.env.GOOGLE_AI_API_KEY
      if (!key) {
        throw new Error(
          'GOOGLE_AI_API_KEY no está definido en .env.\n' +
            'Añade: GOOGLE_AI_API_KEY=AI... en tu archivo .env',
        )
      }
      return new GeminiAdapter(key)
    }
    default: {
      const _exhaustive: never = provider
      throw new Error(`Proveedor LLM desconocido: '${_exhaustive as string}'`)
    }
  }
}
