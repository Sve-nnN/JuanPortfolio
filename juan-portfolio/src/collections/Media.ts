import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

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
      name: 'imgbbUrl',
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
            const formData = new FormData()
            // @ts-ignore
            const fileData = req.file.data
            // @ts-ignore
            const fileName = req.file.name

            if (fileData) {
              const blob = new Blob([fileData as unknown as BlobPart])
              formData.append('image', blob, fileName)

              if (process.env.IMGBB_API_KEY) {
                formData.append('key', process.env.IMGBB_API_KEY)

                const res = await fetch('https://api.imgbb.com/1/upload', {
                  method: 'POST',
                  body: formData,
                })

                const json = await res.json()
                if (json.success && json.data) {
                  data.imgbbUrl = json.data.url
                  // Optionally override the main URL if desired, 
                  // but Payload might overwrite it with its own URL generation.
                  // We will use imgbbUrl in the frontend.
                }
              }
            }
          } catch (error) {
            console.error('Error uploading to ImgBB:', error)
          }
        }
        return data
      },
    ],
  },
  upload: {
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
    staticDir: path.resolve(dirname, '../../public/media'),
    adminThumbnail: ({ doc }) =>
      (doc.imgbbUrl as string) || `https://cdn.juanes.xyz/${doc.filename as string}`,
    focalPoint: true,
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
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
