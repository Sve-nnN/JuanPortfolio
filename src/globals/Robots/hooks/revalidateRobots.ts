import type { GlobalAfterChangeHook } from 'payload'

export const revalidateRobots: GlobalAfterChangeHook = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    // Dynamic import to avoid client-side bundling issues with next/cache
    import('next/cache')
      .then(({ revalidateTag }) => {
        revalidateTag('global_robots')
      })
      .catch(() => {
        // Fail silently
      })
  }

  return doc
}
