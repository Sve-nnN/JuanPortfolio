import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { cloudinaryService } from '../utilities/cloudinary'
import { getOptimizedCloudinaryUrl } from '../utilities/cloudinaryUrl'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import sharp from 'sharp'
import fs from 'fs'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
    components: {
      beforeListTable: ['@/components/admin/CloudinaryUploadAllButton#CloudinaryUploadAllButton'],
    },
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  endpoints: [
    {
      path: '/:id/upload-cloudinary',
      method: 'post',
      handler: async (req) => {
        const id = req.routeParams?.id
        if (!id) return Response.json({ error: 'ID is required' }, { status: 400 })

        try {
          const doc = await req.payload.findByID({
            collection: 'media',
            id: id as string,
          })

          if (!doc) return Response.json({ error: 'Media not found' }, { status: 404 })
          if (doc.cloudinaryUrl)
            return Response.json({ message: 'Already has Cloudinary URL', url: doc.cloudinaryUrl })

          // Try to get from disk first (more reliable for Cloudinary upload)
          const staticDir = path.resolve(process.cwd(), 'public/media')
          const filePath = path.resolve(staticDir, doc.filename as string)
          
          let cloudinaryUrl: string | null = null

          if (fs.existsSync(filePath)) {
            console.log(`Found local file, uploading via buffer: ${filePath}`)
            const fileData = fs.readFileSync(filePath)
            cloudinaryUrl = await cloudinaryService.uploadImage(fileData, doc.filename as string)
          } else {
            // Robust Proxy fallback: Download to server first to bypass 403/Forbidden blocks
            const imageUrl = doc.url?.startsWith('http') 
              ? doc.url 
              : `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}${doc.url}`

            console.log(`File not on disk, proxying upload from URL: ${imageUrl}`)
            try {
              // Add User-Agent to bypass some bot detection blocks (like Cloudflare)
              const response = await fetch(imageUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                  'Referer': process.env.NEXT_PUBLIC_SERVER_URL || 'https://juan-tech.com',
                }
              })
              
              if (response.ok) {
                const arrayBuffer = await response.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)
                cloudinaryUrl = await cloudinaryService.uploadImage(buffer, doc.filename as string)
              } else {
                console.error(`Failed to fetch image for proxy: ${response.status} ${response.statusText}`)
                // Fallback: Let Cloudinary try to download it directly
                console.log(`Attempting direct Cloudinary upload from URL fallback for: ${imageUrl}`)
                cloudinaryUrl = await cloudinaryService.uploadFromUrl(imageUrl, doc.filename as string)
              }
            } catch (fetchError) {
              console.error(`Error proxying image download:`, fetchError)
              // Fallback: Let Cloudinary try to download it directly
              console.log(`Attempting direct Cloudinary upload from URL fallback after error for: ${imageUrl}`)
              cloudinaryUrl = await cloudinaryService.uploadFromUrl(imageUrl, doc.filename as string)
            }
          }

          if (cloudinaryUrl) {
            await req.payload.update({
              collection: 'media',
              id: id as string,
              data: {
                cloudinaryUrl,
              },
            })
            return Response.json({ success: true, url: cloudinaryUrl })
          }

          return Response.json({ error: 'Cloudinary upload failed' }, { status: 500 })
        } catch (error) {
          console.error('Error in upload-cloudinary endpoint:', error)
          return Response.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 },
          )
        }
      },
    },
    {
      path: '/upload-all-cloudinary',
      method: 'post',
      handler: async (req) => {
        try {
          const { docs } = await req.payload.find({
            collection: 'media',
            where: {
              cloudinaryUrl: {
                exists: false,
              },
            },
            limit: 100, // Safety limit
          })

          const results = {
            total: docs.length,
            success: 0,
            failed: 0,
          }

          const staticDir = path.resolve(process.cwd(), 'public/media')

          for (const doc of docs) {
            try {
              const filePath = path.resolve(staticDir, doc.filename as string)
              let cloudinaryUrl: string | null = null

              if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath)
                cloudinaryUrl = await cloudinaryService.uploadImage(fileData, doc.filename as string)
              } else {
                const imageUrl = doc.url?.startsWith('http') 
                  ? doc.url 
                  : `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}${doc.url}`
                
                try {
                  const response = await fetch(imageUrl, {
                    headers: {
                      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                      'Referer': process.env.NEXT_PUBLIC_SERVER_URL || 'https://juan-tech.com',
                    }
                  })
                  if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer()
                    const buffer = Buffer.from(arrayBuffer)
                    cloudinaryUrl = await cloudinaryService.uploadImage(buffer, doc.filename as string)
                  } else {
                    // Fallback to direct URL upload
                    cloudinaryUrl = await cloudinaryService.uploadFromUrl(imageUrl, doc.filename as string)
                  }
                } catch (_e) {
                  console.error(`Proxy download failed for all-upload: ${doc.filename}`)
                  // Final attempt: upload from URL
                  cloudinaryUrl = await cloudinaryService.uploadFromUrl(imageUrl, doc.filename as string)
                }
              }

              if (cloudinaryUrl) {
                await req.payload.update({
                  collection: 'media',
                  id: doc.id,
                  data: {
                    cloudinaryUrl,
                  },
                })
                results.success++
              } else {
                results.failed++
              }
            } catch (_e) {
              console.error(`Failed to upload ${doc.filename}:`, _e)
              results.failed++
            }
          }

          return Response.json(results)
        } catch (error) {
          console.error('Error in upload-all-cloudinary endpoint:', error)
          return Response.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 },
          )
        }
      },
    },
  ],
  fields: [
    {
      name: 'alt',
      type: 'text',
      //required: true,
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
    {
      name: 'cloudinaryUrl',
      type: 'text',
      admin: {
        readOnly: true,
        position: 'sidebar',
        components: {
          afterInput: ['@/components/admin/CloudinaryUploadButton#CloudinaryUploadButton'],
        },
      },
    },
    {
      name: 'dominantColor',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Extracted automatically from the image',
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (req.file) {
          try {
            const fileData = req.file.data
            const fileName = req.file.name

            if (fileData) {
              // Extract dominant color using sharp
              try {
                const { channels } = await sharp(fileData).stats()
                const [r, g, b] = channels.map((c) => Math.round(c.mean))
                data.dominantColor = `rgb(${r}, ${g}, ${b})`
              } catch (colorError) {
                console.error('Error extracting color:', colorError)
              }

              if (operation === 'create' || !data.cloudinaryUrl) {
                // Upload to Cloudinary
                const cloudinaryUrl = await cloudinaryService.uploadImage(
                  fileData as Buffer,
                  fileName,
                )
                if (cloudinaryUrl) {
                  data.cloudinaryUrl = cloudinaryUrl
                }
              }
            }
          } catch (error) {
            console.error('Error processing media:', error)
          }
        }
        return data
      },
    ],
  },
  upload: {
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
    staticDir: path.resolve(dirname, '../../public/media'),
    adminThumbnail: ({ doc }) => {
      if (doc.cloudinaryUrl) {
        return getOptimizedCloudinaryUrl(doc.cloudinaryUrl as string, {
          width: 80,
          height: 80,
          crop: 'thumb',
          format: 'auto',
        })
      }
      return (doc.url as string) || `/media/${doc.filename}`
    },
    focalPoint: true,
    imageSizes: [
      {
        name: 'thumbnail',
        width: 80,
      },
      {
        name: 'square',
        width: 500,
        height: 500,
      },
      {
        name: 'small',
        width: 600,
      },
      {
        name: 'medium',
        width: 900,
      },
      {
        name: 'large',
        width: 1400,
      },
      {
        name: 'xlarge',
        width: 1920,
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center',
      },
    ],
  },
}
