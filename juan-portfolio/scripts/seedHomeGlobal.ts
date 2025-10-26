import type { Payload } from 'payload'

export const seedHomeGlobal = async (_payload: Payload): Promise<void> => {
  _payload.logger.info('Seeding Home Global with default blocks...')

  try {
    // Update the home global with a default layout
    await _payload.updateGlobal({
      slug: 'home',
      data: {
        layout: [
          {
            blockType: 'heroHome',
            badge: 'Disponible para trabajar',
            title: 'Juan Carlos Angulo',
            subtitle: 'Desarrollador Web & Especialista SEO',
            description:
              'Transformo ideas en sitios web rápidos, responsivos y optimizados para motores de búsqueda que impulsan el crecimiento de tu negocio.',
            primaryCta: {
              label: 'Contáctame',
              url: '#contact',
            },
            secondaryCta: {
              label: 'Mi Trabajo',
              url: '#work',
            },
            mediaPosition: 'right',
          },
          {
            blockType: 'aboutWithFeatures',
            eyebrow: 'Sobre mí',
            title: 'Conoce al desarrollador',
            description: {
              root: {
                type: 'root',
                children: [
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'text',
                        text: '¡Hola! Soy Juan Carlos, un desarrollador web apasionado por crear experiencias digitales excepcionales. Con más de 3 años de experiencia en el sector, me especializo en construir soluciones web a medida que no solo lucen bien, sino que también son increíblemente rápidas, intuitivas y están optimizadas para el éxito en los motores de búsqueda.',
                      },
                    ],
                  },
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'text',
                        text: 'Mi filosofía se centra en la colaboración y la transparencia. Me sumerjo en cada proyecto para entender a fondo tus objetivos y traducirlos en un producto digital que genere resultados tangibles.',
                      },
                    ],
                  },
                ],
              },
            },
            ctaText: 'Hablemos de tu proyecto',
            ctaLink: '#contact',
            features: [
              {
                icon: 'Zap',
                title: 'Rendimiento',
                description: 'Sitios web ultrarrápidos para una experiencia de usuario superior.',
              },
              {
                icon: 'Monitor',
                title: 'Responsivo',
                description: 'Adaptabilidad perfecta a todos los dispositivos y pantallas.',
              },
              {
                icon: 'Lightbulb',
                title: 'Intuitivo',
                description: 'Interfaces limpias y fáciles de usar que guían al usuario.',
              },
              {
                icon: 'TrendingUp',
                title: 'SEO',
                description: 'Optimización para motores de búsqueda desde el código.',
              },
            ],
          },
          {
            blockType: 'contactForm',
            eyebrow: 'Contacto',
            title: 'Hablemos de tu proyecto',
            description:
              '¿Tienes una idea o proyecto en mente? Cuéntame más sobre tu visión y trabajemos juntos para hacerla realidad.',
            submitLabel: 'Enviar mensaje',
            contactInfo: [
              {
                icon: 'mail',
                title: 'Email',
                value: 'hola@juancarlos.com',
                href: 'mailto:hola@juancarlos.com',
              },
              {
                icon: 'phone',
                title: 'Teléfono',
                value: '+34 123 456 789',
                href: 'tel:+34123456789',
              },
              {
                icon: 'map-pin',
                title: 'Ubicación',
                value: 'Madrid, España',
              },
            ],
          },
        ],
      },
    })

    _payload.logger.info('✅ Home Global seeded successfully!')
  } catch (error) {
    _payload.logger.error('Error seeding Home Global:')
    _payload.logger.error(error)
  }
}
