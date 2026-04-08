import { RequiredDataFromCollectionSlug } from 'payload'

export const contact: () => RequiredDataFromCollectionSlug<'pages'> = () => {
  return {
    slug: 'contact',
    _status: 'published',
    content: {
      layout: [
        {
          blockType: 'contactForm',
          eyebrow: 'Contacto',
          title: '¿Hablamos?',
          description: 'Cuéntame sobre tu proyecto y te responderé en menos de 24 horas.',
          submitLabel: 'Enviar mensaje',
          sidebarTitle: 'Charlemos sobre tu próximo proyecto',
          sidebarDescription: 'Estoy disponible para proyectos freelance y colaboraciones. ¡Hablemos!',
          socialProofText: 'Más de 50 proyectos completados',
          contactInfo: [
            {
              icon: 'mail',
              title: 'Email',
              value: 'hola@juan-tech.com',
              href: 'mailto:hola@juan-tech.com',
            },
            {
              icon: 'linkedin',
              title: 'LinkedIn',
              value: '/in/juanmtech',
              href: 'https://linkedin.com/in/juanmtech',
            },
            {
              icon: 'github',
              title: 'GitHub',
              value: '@juanmtech',
              href: 'https://github.com/juanmtech',
            },
          ],
        },
      ],
    },
    hero: {
      hero: {
        type: 'lowImpact',
        richText: {
          root: {
            type: 'root',
            children: [
              {
                type: 'heading',
                children: [
                  {
                    type: 'text',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Contacto',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                tag: 'h1',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        },
      },
    },
    title: 'Contacto',
    meta: {
      title: 'Contacto | Juan Tech',
      description: 'Ponte en contacto conmigo para hablar sobre tu próximo proyecto freelance o colaboración.',
    },
  }
}
