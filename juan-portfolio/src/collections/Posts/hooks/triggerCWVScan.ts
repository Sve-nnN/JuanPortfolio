import type { CollectionAfterChangeHook } from 'payload'
import { fetchPageMetrics, saveMetricsToPayload } from '@/scripts/seo/update-cwv'

export const triggerCWVScan: CollectionAfterChangeHook = async ({
  doc, // full document data
  operation, // create / update
  req, // full express request
}) => {
  // Only trigger on create or update
  if (operation !== 'create' && operation !== 'update') return doc

  // Ensure it's a published post (we don't want to scan drafts that might not have public URLs yet)
  if (doc._status !== 'published') return doc

  // We need the server URL to construct the full URL
  // This hook runs on the server, so we can access env vars directly
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const postUrl = `${serverUrl}/blog/${doc.slug}` // Assuming default blog path structure

  // Fire and forget - don't await this so we don't block the UI
  // Note: Vercel serverless functions might terminate if we don't await.
  // Ideally this should go to a job queue (BullMQ/QStash).
  // For now, in a simple setup, we can try floating it, but await is safer for reliability.
  // Given Payload's hook timeout, we'll try to float it but catch errors.

  // Actually, since we want reliable execution, and PSI takes 5-10s, awaiting MIGHT block admin UI too long.
  // We'll trust that the manual Force Scan button exists for failures, and try to execute here without awaiting?
  // No, let's await it but handle error. Or better, fetch the API route we created!
  // Calling the script function directly is better if we are in the same runtime.

  // Let's await it to be safe, user can wait 2-3s. If PSI is slow, it might be annoying.
  // For Vercel, floating promises are killed.
  // Best compromise: Call our own internal API endpoint (fire and forget fetch)

  try {
    // We cannot easily call our own API route without a full HTTP request loop which is weird in a hook.
    // Let's call the logic directly but asynchronously if possible.
    // Valid strategy: Call logic directly.
    const apiKey = process.env.GOOGLE_PSI_API_KEY

    // We purposefully do NOT await this promise to allow the UI to return immediately.
    // On Vercel, this might get killed.
    // If the user wants robust automation, they should use a queue.
    // For now, I will NOT await it, accepting the risk on serverless.
    fetchPageMetrics(postUrl, apiKey)
      .then((metrics) => {
        saveMetricsToPayload(postUrl, metrics).catch((err) =>
          console.error('Failed to save metrics in hook:', err),
        )
      })
      .catch((err) => console.error('Failed to fetch metrics in hook:', err))
  } catch (error) {
    console.error('Error triggering CWV scan in hook:', error)
  }

  return doc
}
