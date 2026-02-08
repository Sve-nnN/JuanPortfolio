import { MediaBlock } from '@/blocks/MediaBlock/Component'
import {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedLinkNode,
  type DefaultTypedEditorState,
} from '@payloadcms/richtext-lexical'
import {
  JSXConvertersFunction,
  LinkJSXConverter,
  RichText as ConvertRichText,
} from '@payloadcms/richtext-lexical/react'

import { CodeBlock, CodeBlockProps } from '@/blocks/Code/Component'

import type {
  BannerBlock as BannerBlockProps,
  CallToActionBlock as CTABlockProps,
  MediaBlock as MediaBlockProps,
} from '@/payload-types'
import { BannerBlock } from '@/blocks/Banner/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { cn } from '@/utilities/ui'

type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<CTABlockProps | MediaBlockProps | BannerBlockProps | CodeBlockProps>

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
  const { value, relationTo } = linkNode.fields.doc!
  if (typeof value !== 'object') {
    throw new Error('Expected value to be an object')
  }
  const slug = value.slug

  // Para posts, usar /blog/{category}/{slug}
  if (relationTo === 'posts') {
    // Intentar obtener la categoría del post
    const post = value as {
      slug?: string
      meta_extras?: {
        categories?: Array<string | { slug?: string; title?: string }>
      }
    }

    const categories = post.meta_extras?.categories
    let categorySlug = 'general' // Categoría por defecto

    if (categories && categories.length > 0) {
      const firstCategory = categories[0]
      if (typeof firstCategory === 'object' && firstCategory.slug) {
        categorySlug = firstCategory.slug
      } else if (typeof firstCategory === 'string') {
        categorySlug = firstCategory
      }
    }

    return `/blog/${categorySlug}/${slug}`
  }

  return `/${slug}`
}

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
  blocks: {
    banner: ({ node }) => <BannerBlock className="col-start-2 mb-4" {...node.fields} />,
    mediaBlock: ({ node }) => (
      <MediaBlock
        className="col-start-1 col-span-3"
        imgClassName="m-0"
        {...node.fields}
        captionClassName="mx-auto max-w-[48rem]"
        enableGutter={false}
        disableInnerContainer={true}
      />
    ),
    'code-block': ({ node }) => <CodeBlock className="col-start-2" {...node.fields} />,
    cta: ({ node }) => <CallToActionBlock {...node.fields} />,
  },
})

type Props = {
  data: DefaultTypedEditorState
  enableGutter?: boolean
  enableProse?: boolean
} & React.HTMLAttributes<HTMLDivElement>

export default function RichText(props: Props) {
  const { className, enableProse = true, enableGutter = true, ...rest } = props
  return (
    <ConvertRichText
      converters={jsxConverters}
      className={cn(
        'payload-richtext',
        {
          container: enableGutter,
          'max-w-none': !enableGutter,
        },
        enableProse && [
          // Base prose styles
          'prose prose-lg dark:prose-invert',
          'max-w-none',
          // Headings - scroll offset and improved hierarchy
          'prose-headings:scroll-mt-24', // Offset for sticky header when navigating via TOC
          'prose-headings:font-semibold',
          'prose-headings:tracking-tight',
          'prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4',
          'prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3',
          'prose-h4:text-xl prose-h4:mt-6 prose-h4:mb-2',
          // Links - enhanced treatment
          'prose-a:text-primary',
          'prose-a:no-underline',
          'prose-a:font-medium',
          'hover:prose-a:underline',
          'prose-a:decoration-primary/30',
          'prose-a:underline-offset-4',
          'prose-a:transition-all',
          // Paragraphs - improved readability
          'prose-p:leading-relaxed',
          'prose-p:text-foreground/90',
          // Code blocks
          'prose-code:text-sm',
          'prose-code:font-mono',
          'prose-code:bg-muted',
          'prose-code:px-1.5',
          'prose-code:py-0.5',
          'prose-code:rounded',
          'prose-code:before:content-none',
          'prose-code:after:content-none',
          'prose-pre:bg-slate-900',
          'dark:prose-pre:bg-slate-950',
          'prose-pre:border',
          'prose-pre:border-border',
          // Images - polished presentation
          'prose-img:rounded-xl',
          'prose-img:shadow-lg',
          'prose-img:my-8',
          // Lists - better spacing
          'prose-li:my-1.5',
          'prose-ul:my-6',
          'prose-ol:my-6',
          // Blockquotes - enhanced style
          'prose-blockquote:border-l-4',
          'prose-blockquote:border-l-primary',
          'prose-blockquote:italic',
          'prose-blockquote:text-muted-foreground',
          'prose-blockquote:pl-6',
          // Strong text
          'prose-strong:text-foreground',
          'prose-strong:font-semibold',
        ],
        className,
      )}
      {...rest}
    />
  )
}
