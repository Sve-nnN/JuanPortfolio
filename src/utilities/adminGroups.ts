/**
 * Única fuente de verdad para los labels de grupo del sidebar del admin de Payload.
 *
 * Payload 3.61.1 acepta `admin.group` como objeto localizado por clave de i18n del
 * proyecto (`es` como fallback y `en`). Ver
 * `payload/dist/collections/config/types.d.ts` → `group?: false | Record<string,string> | string`.
 *
 * NO inline-ees estos strings en las configs: un typo crearía silenciosamente un grupo
 * fantasma sin error de compilación. Importa siempre `ADMIN_GROUP` desde este módulo.
 */
export const ADMIN_GROUP = {
  CONTENIDO: { es: 'Contenido', en: 'Content' },
  SITIO: { es: 'Sitio', en: 'Site' },
  SEO: { es: 'SEO/Métricas', en: 'SEO & Metrics' },
  MARKETING: { es: 'Marketing', en: 'Marketing' },
} as const satisfies Record<string, Record<string, string>>
