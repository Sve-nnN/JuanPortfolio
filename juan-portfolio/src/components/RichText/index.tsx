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
  FAQBlock as FAQBlockProps,
  MediaBlock as MediaBlockProps,
} from '@/payload-types'
import { BannerBlock } from '@/blocks/Banner/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { FAQBlock } from '@/blocks/FAQ/Component'
import { cn } from '@/utilities/ui'

type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<
      CTABlockProps | MediaBlockProps | BannerBlockProps | CodeBlockProps | FAQBlockProps
    >

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

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface TextLikeNode {
  text?: string
  children?: TextLikeNode[]
}

const extractText = (node: TextLikeNode): string => {
  if (node.text) return node.text
  if (node.children) return node.children.map(extractText).join('')
  return ''
}

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
  heading: ({ node, nodesToJSX }) => {
    const text = (node.children as TextLikeNode[]).map(extractText).join('')
    const id = slugify(text)
    const Tag = node.tag
    return (
      <Tag id={id} className={`scroll-mt-32`}>
        {nodesToJSX({
          nodes: node.children,
        })}
      </Tag>
    )
  },
  quote: ({ node, nodesToJSX }) => {
    return (
      <blockquote className="my-8 border-l-4 border-primary/20 pl-6 italic text-foreground bg-secondary/10 py-4 rounded-r-lg">
        {nodesToJSX({
          nodes: node.children,
        })}
      </blockquote>
    )
  },
  table: ({ node, nodesToJSX }) => {
    return (
      <div className="my-10 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left border-collapse m-0">
          <tbody className="divide-y divide-border">
            {nodesToJSX({
              nodes: node.children,
            })}
          </tbody>
        </table>
      </div>
    )
  },
  tablerow: ({ node, nodesToJSX }) => {
    return (
      <tr className="hover:bg-muted/30 transition-colors">
        {nodesToJSX({
          nodes: node.children,
        })}
      </tr>
    )
  },
  tablecell: ({ node, nodesToJSX }) => {
    return (
      <td
        className={cn(
          'p-4 text-base align-top border-r border-border last:border-0',
          node.header ? 'font-bold bg-muted/50 text-foreground' : 'text-muted-foreground',
        )}
      >
        {nodesToJSX({
          nodes: node.children,
        })}
      </td>
    )
  },
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
    faq: ({ node }) => <FAQBlock {...node.fields} />,
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
          'prose prose-xl dark:prose-invert',
          'max-w-none',
          // Headings - scroll offset and improved hierarchy
          'prose-headings:scroll-mt-32', // Offset for sticky header
          'prose-headings:font-display',
          'prose-headings:font-bold',
          'prose-headings:tracking-tight',
          'prose-headings:text-foreground',
          'prose-h2:text-4xl md:text-5xl prose-h2:mt-20 prose-h2:mb-8 leading-tight',
          'prose-h3:text-3xl md:text-4xl prose-h3:mt-16 prose-h3:mb-6 leading-tight',
          'prose-h4:text-2xl md:text-3xl prose-h4:mt-12 prose-h4:mb-4 leading-tight',
          // Links - enhanced treatment
          'prose-a:text-primary',
          'prose-a:no-underline',
          'prose-a:font-bold',
          'hover:prose-a:text-primary/80',
          'prose-a:border-b-2 prose-a:border-primary/20 hover:prose-a:border-primary',
          'prose-a:transition-all',
          // Paragraphs - improved readability
          'prose-p:leading-relaxed',
          'prose-p:text-muted-foreground',
          'prose-p:font-medium',
          // Code blocks
          'prose-code:text-base',
          'prose-code:font-mono',
          'prose-code:bg-secondary/50',
          'prose-code:px-2',
          'prose-code:py-1',
          'prose-code:rounded-lg',
          'prose-code:text-foreground',
          'prose-code:before:content-none',
          'prose-code:after:content-none',
          'prose-pre:bg-card',
          'prose-pre:border',
          'prose-pre:border-border/50',
          'prose-pre:rounded-[1.5rem]',
          'prose-pre:shadow-inner',
          // Images - polished presentation
          'prose-img:rounded-[2rem]',
          'prose-img:shadow-2xl',
          'prose-img:my-16',
          // Lists - better spacing
          'prose-li:my-3',
          'prose-ul:my-10',
          'prose-ol:my-10',
          // Blockquotes - enhanced style
          'prose-blockquote:border-l-8',
          'prose-blockquote:border-l-primary/20',
          'prose-blockquote:italic',
          'prose-blockquote:text-foreground',
          'prose-blockquote:font-bold',
          'prose-blockquote:pl-10',
          'prose-blockquote:py-4',
          'prose-blockquote:bg-secondary/20',
          'prose-blockquote:rounded-r-[2rem]',
          // Strong text
          'prose-strong:text-foreground',
          'prose-strong:font-bold',
        ],
        className,
      )}
      {...rest}
    />
  )
}
