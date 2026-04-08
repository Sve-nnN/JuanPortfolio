import React from 'react'
import type { ArchiveBlock as ArchiveBlockProps, Post } from '@/payload-types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { CollectionArchive } from '@/components/CollectionArchive'
import RichText from '@/components/RichText'

export const ArchiveBlock: React.FC<
  ArchiveBlockProps & {
    locale?: 'en' | 'es'
  }
> = async (props) => {
  const {
    id,
    categories,
    introContent,
    limit: limitFromProps,
    populateBy,
    relationTo,
    selectedDocs,
    locale = 'es'
  } = props

  const limit = limitFromProps || 3

  let posts: Post[] = []

  if (populateBy === 'collection') {
    const payload = await getPayload({ config: configPromise })

    const flattenedCategories = categories?.map((category) => {
      if (typeof category === 'object') return category.id
      return category
    })

    const fetchedPosts = await payload.find({
      collection: relationTo || 'posts',
      depth: 2,
      limit,
      locale,
      select: {
        slug: true,
        title: true,
        meta: true,
        categories: true,
      },
      where: {
        and: [
          ...(flattenedCategories && flattenedCategories.length > 0
            ? [
                {
                  categories: {
                    in: flattenedCategories,
                  },
                },
              ]
            : []),
          {
            _status: {
              equals: 'published',
            },
          },
        ],
      },
    })

      posts = (fetchedPosts.docs as Post[]).map(p => ({
        ...p,
        // Ensure meta is type-safe for Card
        meta: p.meta || {},
      })) as Post[]
  } else {
    if (selectedDocs) {
      posts = selectedDocs
        .map((post) => {
          if (typeof post.value === 'object') return post.value as Post
          return null
        })
        .filter(Boolean) as Post[]
    }
  }

  return (
    <div className="my-16" id={id ? `block-${id}` : undefined}>
      {introContent && (
        <div className="container mb-16">
          <RichText className="ms-0 max-w-[48rem]" data={introContent} enableGutter={false} />
        </div>
      )}
      <CollectionArchive posts={posts} relationTo={relationTo as 'posts' | 'case-studies'} locale={locale} />
    </div>
  )
}
