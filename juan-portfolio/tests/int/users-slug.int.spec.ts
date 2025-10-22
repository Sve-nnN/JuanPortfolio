import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getPayload, Payload } from 'payload'
import { createWithRetries, deleteIfExists } from './helpers/createWithRetries'

let payload: Payload
beforeAll(async () => {
  const get = await import('../../src/payload.config.ts')
  const config = get.default
  payload = await getPayload({ config })
})


describe('Users slug behavior', () => {
  it('autogenerates slug from name on create', async () => {
    const unique = Date.now()
    const user = await createWithRetries(payload, {
      collection: 'users',
      data: { name: 'Juan Test User', email: `juan-test+${unique}@example.com`, password: 'password123' } as any,
    })
    expect(user.slug).toBeDefined()
    expect(user.slug).toMatch(/juan-test-user/)

    // cleanup
    await deleteIfExists(payload, 'users', user.id)
    await new Promise((r) => setTimeout(r, 150))
  }, 20000)

  it('appends suffix when duplicate slug exists', async () => {
  const uniq1 = Date.now()
  const u1 = await createWithRetries(payload, { collection: 'users', data: { name: 'Dup User', email: `dup1+${uniq1}@example.com`, password: 'password1' } as any })
  await new Promise((r) => setTimeout(r, 150))
  const u2 = await createWithRetries(payload, { collection: 'users', data: { name: 'Dup User', email: `dup2+${uniq1}@example.com`, password: 'password2' } as any })

    expect(u1.slug).toBeDefined()
    expect(u2.slug).toBeDefined()
    expect(u1.slug).not.toEqual(u2.slug)

    // cleanup
    await deleteIfExists(payload, 'users', u1.id)
    await deleteIfExists(payload, 'users', u2.id)
    await new Promise((r) => setTimeout(r, 150))
  }, 20000)

  it('allows updating user without changing slug if same doc', async () => {
  const mySlug = `no-change-user-${Date.now()}`
  const u = await createWithRetries(payload, { collection: 'users', data: { name: 'No Change User', email: `noch+${Date.now()}@example.com`, password: 'password', slug: mySlug } as any })
  await new Promise((r) => setTimeout(r, 150))
  const updated = await payload.update({ collection: 'users', id: u.id, data: { role: 'Updated Role' } })
    // slug should remain unchanged when updating a non-slug field
    expect(updated.slug).toBe(u.slug)
    await deleteIfExists(payload, 'users', u.id)
    await new Promise((r) => setTimeout(r, 150))
  }, 20000)
})
