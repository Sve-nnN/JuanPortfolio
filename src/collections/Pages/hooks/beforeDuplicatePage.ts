import type { FieldHook } from 'payload'

/**
 * Field-level `beforeDuplicate` hooks para la colección `Pages`.
 *
 * En Payload 3.61.1 `beforeDuplicate` es un hook A NIVEL DE CAMPO
 * (`field.hooks.beforeDuplicate: FieldHook[]`) que DEVUELVE el nuevo valor del
 * campo (no `data`). Se usa para evitar colisiones en campos `unique` al duplicar.
 */

/**
 * Genera un slug libre para el documento duplicado.
 *
 * El campo `slug` no es localizado (text global), así que `value` es string.
 * Candidato base `${value}-copy`; si ya existe en `pages`, incrementa a
 * `-copy-2`, `-copy-3`, … hasta encontrar uno libre. Límite de guarda de 100
 * intentos con fallback a un sufijo basado en timestamp.
 */
export const uniqueSlugBeforeDuplicate: FieldHook = async ({ value, req }) => {
  if (typeof value !== 'string' || value.length === 0) {
    return value
  }

  const base = `${value}-copy`

  const slugExists = async (candidate: string): Promise<boolean> => {
    const result = await req.payload.find({
      collection: 'pages',
      where: { slug: { equals: candidate } },
      limit: 1,
      depth: 0,
      pagination: false,
      overrideAccess: true,
    })
    return result.docs.length > 0
  }

  if (!(await slugExists(base))) {
    return base
  }

  const MAX_ATTEMPTS = 100
  for (let i = 2; i <= MAX_ATTEMPTS; i++) {
    const candidate = `${value}-copy-${i}`
    if (!(await slugExists(candidate))) {
      return candidate
    }
  }

  // Fallback improbable: garantiza unicidad sin bucle infinito.
  return `${value}-copy-${Date.now()}`
}

/**
 * Sufija el título con " (copy)" para distinguir la copia en el listado.
 *
 * El campo `title` es `localized: true`, así que `value` puede llegar como
 * string (un locale) o como objeto por-locale `{ en, es }`.
 */
export const suffixTitleBeforeDuplicate: FieldHook = ({ value }) => {
  if (typeof value === 'string') {
    return `${value} (copy)`
  }

  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {}
    for (const [locale, localeValue] of Object.entries(value as Record<string, unknown>)) {
      next[locale] = typeof localeValue === 'string' ? `${localeValue} (copy)` : localeValue
    }
    return next
  }

  return value
}
