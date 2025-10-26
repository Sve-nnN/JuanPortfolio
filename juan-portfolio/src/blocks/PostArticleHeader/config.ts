import type { Block } from 'payload'

export const PostArticleHeader: Block = {
  slug: 'postArticleHeader',
  interfaceName: 'PostArticleHeaderBlock',
  fields: [
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        description: 'Categoría principal del artículo',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: 'Título del artículo',
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'Autor del artículo',
      },
    },
    {
      name: 'publishedDate',
      type: 'date',
      admin: {
        description: 'Fecha de publicación',
      },
    },
    {
      name: 'readTime',
      type: 'text',
      admin: {
        description: 'Tiempo estimado de lectura (ej: "5 min de lectura")',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'Imagen destacada del artículo (16:9)',
      },
    },
    {
      name: 'showSocialShare',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Mostrar botones para compartir en redes sociales',
      },
    },
  ],
}
