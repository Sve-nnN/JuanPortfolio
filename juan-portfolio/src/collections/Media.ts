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

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
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
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === 'create' && req.file) {
          try {
            const fileData = req.file.data
            const fileName = req.file.name

            if (fileData) {
              // Upload to Cloudinary
              const cloudinaryUrl = await cloudinaryService.uploadImage(
                fileData as Buffer,
                fileName,
              )
              if (cloudinaryUrl) {
                data.cloudinaryUrl = cloudinaryUrl
              }
            }
          } catch (error) {
            console.error('Error uploading media:', error)
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
