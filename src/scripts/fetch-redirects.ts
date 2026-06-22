import { getPayload } from 'payload'
import configPromise from '@payload-config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Redirect } from '@/payload-types'
import { getPostUrl } from '@/utilities/getPostUrl'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

async function fetchRedirects() {
    try {
        const payload = await getPayload({ config: configPromise })

        const { docs: redirectDocs } = await payload.find({
            collection: 'redirects',
            limit: 0,
            depth: 1,
        })

        // Helper function to normalise URL
        const normalizeUrl = (url: string) => {
            if (url.startsWith('http')) return url;
            return url.startsWith('/') ? url : `/${url}`
        }

        const rawRedirects = (redirectDocs || []).map((redirect: Redirect) => {
            const { from, to } = redirect
            let destination = '/'

            if (to?.type === 'custom' && to.url) {
                destination = to.url
            } else if (
                to?.type === 'reference' &&
                to.reference &&
                typeof to.reference.value === 'object'
            ) {
                const relationTo = to.reference.relationTo
                const value = to.reference.value

                if (relationTo === 'pages' && value) {
                    // Payload types mismatch
                    const slug = value.slug
                    destination = slug === 'home' ? '/' : `/${slug}`
                } else if (relationTo === 'posts' && value) {
                    // Payload types mismatch
                    destination = getPostUrl(value)
                }
            }

            return {
                source: normalizeUrl(from).replace(/\/$/, ''), // Remove trailing slash for consistency
                destination: normalizeUrl(destination),
                permanent: true,
            }
        })

        // Build a map for quick lookup
        const redirectMap = new Map<string, string>()
        rawRedirects.forEach(({ source, destination }) => {
            redirectMap.set(source, destination)
        })

        const resolvedRedirects: typeof rawRedirects = []
        const loopsDetected: string[] = []

        // Resolve chains and detect loops
        rawRedirects.forEach((r) => {
            const currentPath = r.source
            let currentDest = r.destination
            const visited = new Set<string>([currentPath])
            let isLoop = false

            // Chase the redirect chain
            // Limit depth to avoid unforeseen infinite whiles (though visited set handles strict loops)
            let depth = 0
            const MAX_DEPTH = 50

            while (redirectMap.has(currentDest) && depth < MAX_DEPTH) {
                if (visited.has(currentDest)) {
                    isLoop = true
                    break
                }
                visited.add(currentDest)
                currentDest = redirectMap.get(currentDest)!
                depth++
            }

            if (isLoop) {
                loopsDetected.push(`${currentPath} -> ... -> ${currentDest} (Loop)`)
            } else {
                // Optimization: If A -> B -> C, we store A -> C
                resolvedRedirects.push({
                    source: r.source,
                    destination: currentDest,
                    permanent: true
                })
            }
        })

        if (loopsDetected.length > 0) {
            console.warn('⚠️ Infinite redirect loops detected and excluded:')
            loopsDetected.forEach((loop) => console.warn(`  - ${loop}`))
        }

        const dynamicRedirects = resolvedRedirects

        const outputPath = path.resolve(dirname, '../../redirects.json')
        fs.writeFileSync(outputPath, JSON.stringify(dynamicRedirects, null, 2))
        console.log(`✅ Redirects fetched and saved to ${outputPath}`)
        process.exit(0)
    } catch (error) {
        const isPayloadInitError = error && typeof error === 'object' && 'payloadInitError' in error
        if (isPayloadInitError) {
            console.warn('⚠️ Payload not available (missing secrets). Skipping redirects fetch — using existing redirects.json.')
            process.exit(0)
        }
        console.error('Error fetching redirects:', error)
        process.exit(1)
    }
}

fetchRedirects()
