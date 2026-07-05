import type { GlobalConfig } from 'payload'
import { revalidateRobots } from './hooks/revalidateRobots'

// Default ASCII banner rendered from public/favicon.svg (chafa, ascii symbols).
// Stored WITHOUT leading "#": the route handler prefixes each line as a comment.
const DEFAULT_ASCII = `                       __
                    _a@@@@y_
                _yg@@@@@@@@@@gy_
                ~R@@@@P~~R@@@@@@@y_
         _yy_      ~~      ~4@@@@@@@gy_
        J@@@@@y_              ~~R@@@@@@
        J@@@@@@@@gy_             \`~@@@@
        J@@@@@@@@@@@@y_            @@@@
        J@@@@ \`~4@@@@@@@gy         @@@@
        J@@@@     ~~@@@@@@         @@@@
        J@@@@        \`~4@@         @@@@
        J@@@@            ~         ~@@@
        J@@@@y                       \`~
        J@@@@@@gy_            _ygy_
         \`~4@@@@@@@g_     _yg@@@@@@@=
             ~?@@@@@@@gyy$@@@@@@@F~
                \`~4@@@@@@@@@@P~\`
                    ~?@@@@F~
                       \`\``

const DEFAULT_MESSAGE = `juan-tech.com — just build it.
¿Te gusta el código limpio? Escribime: hola@juan-tech.com`

export const Robots: GlobalConfig = {
  slug: 'robots',
  label: 'Robots.txt',
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [revalidateRobots],
  },
  admin: {
    group: 'SEO',
    description:
      'Controla el /robots.txt del sitio. Los sitemaps se agregan automáticamente y no se editan aquí.',
  },
  fields: [
    {
      name: 'asciiArt',
      type: 'textarea',
      label: 'Banner ASCII (logo)',
      defaultValue: DEFAULT_ASCII,
      admin: {
        description:
          'Arte ASCII que aparece como comentario al inicio del archivo (estilo Nike). Se antepone "#" a cada línea automáticamente. Dejá vacío para omitirlo.',
        rows: 20,
      },
    },
    {
      name: 'message',
      type: 'textarea',
      label: 'Mensaje de marca',
      defaultValue: DEFAULT_MESSAGE,
      admin: {
        description:
          'Texto de marca debajo del logo (una línea por renglón). También se muestra como comentario.',
        rows: 4,
      },
    },
    {
      name: 'disallow',
      type: 'array',
      label: 'Rutas bloqueadas (Disallow)',
      labels: { singular: 'Ruta', plural: 'Rutas' },
      defaultValue: [{ path: '/admin' }, { path: '/api/' }],
      admin: {
        description: 'Rutas que los crawlers NO deben rastrear. User-agent: * y Allow: / son fijos.',
      },
      fields: [
        {
          name: 'path',
          type: 'text',
          required: true,
          admin: { placeholder: '/admin' },
        },
      ],
    },
  ],
}
