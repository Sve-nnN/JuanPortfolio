import type { CollectionAfterChangeHook } from 'payload'

export const createRedirectOnSlugChange: CollectionAfterChangeHook = async ({
    doc,
    previousDoc,
    operation,
    req: { payload },
    collection,
}) => {
    if (operation === 'update' && previousDoc?.slug && doc?.slug && previousDoc.slug !== doc.slug) {
        const from = `/${previousDoc.slug}`
        const to = `/${doc.slug}`

        payload.logger.info(`Creating redirect from ${from} to ${to}`)

        try {
            await payload.create({
                collection: 'redirects',
                data: {
                    from,
                    to: {
                        type: 'reference',
                        reference: {
                            relationTo: collection.slug as 'pages' | 'posts',
                            value: doc.id,
                        },
                    },
                },
            })
        } catch (error) {
            payload.logger.error(`Error creating redirect: ${error}`)
        }
    }

    return doc
}
