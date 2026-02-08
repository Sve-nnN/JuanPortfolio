
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { importPosts } from '../../../src/scripts/importPosts'
import payload from 'payload'
import fs from 'fs'
import path from 'path'

// Mock payload
const { mockPayload } = vi.hoisted(() => {
    return {
        mockPayload: {
            find: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        }
    }
})

vi.mock('payload', async () => {
    return {
        getPayload: vi.fn().mockResolvedValue(mockPayload),
        buildConfig: vi.fn((config) => config), // Mock buildConfig to just return the config
    }
})

// Mock the config file import
vi.mock('@payload-config', () => ({
    default: Promise.resolve({})
}))

// Mock readline for interactive prompts
vi.mock('readline', () => ({
    default: {
        createInterface: vi.fn().mockReturnValue({
            question: vi.fn((q, cb) => cb('Y')), // Default to Yes
            close: vi.fn(),
        })
    }
}))

// Mock fs
vi.mock('fs', async () => {
    const actual = await vi.importActual<any>('fs');
    return {
        ...actual,
        default: {
            ...actual,
            readdirSync: vi.fn(),
            readFileSync: vi.fn(),
            statSync: vi.fn(),
            existsSync: vi.fn(),
        },
        readdirSync: vi.fn(),
        readFileSync: vi.fn(),
        statSync: vi.fn(),
        existsSync: vi.fn(),
    }
})

describe('importPosts', () => {
    beforeEach(() => {
        vi.clearAllMocks()
            ; (fs.readdirSync as any).mockReturnValue([])
            ; (fs.existsSync as any).mockReturnValue(true)
            ; (mockPayload.find as any).mockResolvedValue({ docs: [] })
            ; (mockPayload.create as any).mockResolvedValue({ id: 'mock-id' })
    })

    it('should return initial stats', async () => {
        const stats = await importPosts()
        expect(stats).toEqual({
            imported: 0,
            updated: 0,
            failed: 0,
            skipped: 0
        })
    })

    // RED: This test should fail once we implement logic to actually look for files
    it('should find markdown files in the posts directory', async () => {
        // Arrange
        const mockPostsDir = path.resolve(process.cwd(), 'content/posts')
            ; (fs.readdirSync as any).mockReturnValue(['tech'])
            ; (fs.statSync as any).mockImplementation((path: string) => ({
                isDirectory: () => !path.endsWith('.md'),
                isFile: () => path.endsWith('.md')
            }))
            // Mock recursive readdir for tech folder
            ; (fs.readdirSync as any).mockImplementation((p: string) => {
                if (p.endsWith('tech')) return ['first-post.md']
                if (p.endsWith('posts')) return ['tech']
                return []
            })

            ; (fs.readFileSync as any).mockReturnValue(`---
title: "Test Post"
---
Content`)

        // Act
        const stats = await importPosts()

        // Assert
        // 1. Check if category was looked up/created
        expect(mockPayload.find).toHaveBeenCalledWith(expect.objectContaining({
            collection: 'categories',
            where: { slug: { equals: 'tech' } }
        }))

        // 2. Check if post was created with correct data
        expect(mockPayload.create).toHaveBeenCalledWith(expect.objectContaining({
            collection: 'posts',
            data: expect.objectContaining({
                title: 'Test Post',
                slug: 'first-post',
                categories: expect.anything(),
            })
        }))
    })

    it('should skip file if title is missing', async () => {
        // Mock readdir to return a file without title
        ; (fs.readdirSync as any).mockImplementation((p: string) => {
            if (p.endsWith('tech')) return ['no-title.md']
            if (p.endsWith('posts')) return ['tech']
            return []
        })
            ; (fs.readFileSync as any).mockReturnValue(`---
author: "me"
---
No title`)

        const stats = await importPosts()
        expect(stats.failed).toBe(1)
        expect(stats.imported).toBe(0)
    })

    it('should resolve related posts by slug', async () => {
        // Mock readdir to return file with related posts
        ; (fs.readdirSync as any).mockImplementation((p: string) => {
            if (p.endsWith('tech')) return ['related-test.md']
            if (p.endsWith('posts')) return ['tech']
            return []
        })

            ; (fs.readFileSync as any).mockReturnValue(`---
title: "Post with Related"
relatedPosts: ["other-post-slug"]
---
Content`)

            // Mock finding the related post
            ; (mockPayload.find as any).mockImplementation((args: any) => {
                if (args.collection === 'posts' && args.where.slug && args.where.slug.equals === 'other-post-slug') {
                    return { docs: [{ id: 'related-id-123' }] }
                }
                if (args.collection === 'categories') return { docs: [{ id: 'cat-id' }] }
                return { docs: [] }
            })

        await importPosts()

        expect(mockPayload.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                relatedPosts: ['related-id-123']
            })
        }))
    })
})
