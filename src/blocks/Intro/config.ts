import type { Block } from 'payload'

export const Intro: Block = {
  slug: 'intro',
  interfaceName: 'IntroBlock',
  fields: [
    {
      name: 'heading',
      type: 'text',
      localized: true,
    },
    {
      name: 'body',
      type: 'textarea',
      localized: true,
    },
  ],
}

export default Intro
