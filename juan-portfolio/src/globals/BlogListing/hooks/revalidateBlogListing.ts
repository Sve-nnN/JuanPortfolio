import type { GlobalAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

export const revalidateBlogListing: GlobalAfterChangeHook = ({ doc, req: { payload } }) => {
    payload.logger.info(`Revalidating blog listing`)

    revalidateTag('global_blog-listing')

    return doc
}
