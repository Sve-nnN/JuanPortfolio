import type { GlobalAfterChangeHook } from 'payload'

export const revalidateLLM: GlobalAfterChangeHook = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    // Dynamic import to avoid client-side bundling issues with next/cache
    import('next/cache').then(({ revalidateTag }) => {
      revalidateTag('llms-txt')
    }).catch(() => {
      // Fail silently
    })
  }

  return doc
}
