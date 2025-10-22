import { Payload } from 'payload'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function createWithRetries(payload: Payload, opts: { collection: string; data: any }, maxAttempts = 5) {
  let attempt = 0
  let lastErr: any
  const base = { ...opts.data }
  while (attempt < maxAttempts) {
    try {
      const created = await payload.create({ collection: opts.collection, data: opts.data })
      return created
    } catch (err: any) {
      lastErr = err
      const msg = err?.message || ''
      // If it's a validation error mentioning slug or email, try to alter slug/email
      if (msg.includes('slug') || msg.includes('Email') || msg.includes('email')) {
        // ensure data has slug; if not, add one
        const suffix = Date.now() + '-' + attempt
        if (opts.data.slug) {
          opts.data.slug = `${base.slug || 'item'}-${suffix}`
        } else if (opts.data.title) {
          opts.data.slug = `${String(opts.data.title).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${suffix}`
        } else if (opts.data.name) {
          opts.data.slug = `${String(opts.data.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${suffix}`
        } else {
          opts.data.slug = `item-${suffix}`
        }
      } else if (msg.includes('Unable to acquire IX lock') || msg.includes('lock')) {
        // transient mongo lock - wait a bit
        await sleep(200 + attempt * 100)
      } else {
        // other errors - break and rethrow
        throw err
      }
      attempt += 1
      await sleep(100 + attempt * 50)
    }
  }
  throw lastErr
}

export async function deleteIfExists(payload: Payload, collection: string, id: string) {
  try {
    await payload.delete({ collection, id })
  } catch (e) {
    // ignore
  }
}
