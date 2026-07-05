import type { CollectionConfig } from 'payload'
import { ADMIN_GROUP } from '@/utilities/adminGroups'

const Clientes: CollectionConfig = {
    slug: 'clientes',
    labels: {
        singular: 'Cliente',
        plural: 'Clientes',
    },
    admin: {
        group: ADMIN_GROUP.MARKETING,
        useAsTitle: 'name',
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
            label: 'Nombre (Título)',
        },
        {
            name: 'logo',
            type: 'upload',
            relationTo: 'media',
            required: true,
            label: 'Logo (Imagen)',
        },
        {
            name: 'url',
            type: 'text',
            label: 'URL',
        },
        {
            name: 'invertInDark',
            type: 'checkbox',
            label: 'Invertir en modo oscuro (para logos negros)',
            defaultValue: false,
        },
        {
            name: 'forceWhiteBackground',
            type: 'checkbox',
            label: 'Forzar fondo blanco (para logos con poco contraste)',
            defaultValue: false,
        },
    ],
}

export default Clientes
