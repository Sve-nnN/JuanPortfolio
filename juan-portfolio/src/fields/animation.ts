import type { Field } from 'payload'

export interface AnimationConfig {
    enabled?: boolean | null
    type?: 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce' | null
    direction?: 'up' | 'down' | 'left' | 'right' | 'none' | null
    duration?: number | null
    delay?: number | null
    easing?: 'ease' | 'easeIn' | 'easeOut' | 'easeInOut' | 'linear' | null
    staggerChildren?: number | null
    viewportAmount?: number | null
}

export const animationField = (): Field => ({
    name: 'animation',
    type: 'group',
    label: 'Animación de Scroll',
    admin: {
        description: 'Configura cómo se animará este elemento al hacer scroll',
    },
    fields: [
        {
            name: 'enabled',
            type: 'checkbox',
            label: 'Habilitar Animación',
            defaultValue: true,
        },
        {
            name: 'type',
            type: 'select',
            label: 'Tipo de Animación',
            defaultValue: 'fade',
            options: [
                { label: 'Fade In', value: 'fade' },
                { label: 'Slide', value: 'slide' },
                { label: 'Scale', value: 'scale' },
                { label: 'Rotate', value: 'rotate' },
                { label: 'Bounce', value: 'bounce' },
            ],
            admin: {
                condition: (data, siblingData) => siblingData?.enabled,
            },
        },
        {
            name: 'direction',
            type: 'select',
            label: 'Dirección',
            defaultValue: 'up',
            options: [
                { label: 'Arriba', value: 'up' },
                { label: 'Abajo', value: 'down' },
                { label: 'Izquierda', value: 'left' },
                { label: 'Derecha', value: 'right' },
                { label: 'Ninguna', value: 'none' },
            ],
            admin: {
                condition: (data, siblingData) => siblingData?.enabled && siblingData?.type === 'slide',
            },
        },
        {
            name: 'duration',
            type: 'number',
            label: 'Duración (segundos)',
            defaultValue: 0.6,
            min: 0.1,
            max: 3,
            admin: {
                step: 0.1,
                condition: (data, siblingData) => siblingData?.enabled,
            },
        },
        {
            name: 'delay',
            type: 'number',
            label: 'Retraso (segundos)',
            defaultValue: 0,
            min: 0,
            max: 2,
            admin: {
                step: 0.1,
                condition: (data, siblingData) => siblingData?.enabled,
            },
        },
        {
            name: 'easing',
            type: 'select',
            label: 'Suavizado',
            defaultValue: 'easeOut',
            options: [
                { label: 'Ease', value: 'ease' },
                { label: 'Ease In', value: 'easeIn' },
                { label: 'Ease Out', value: 'easeOut' },
                { label: 'Ease In Out', value: 'easeInOut' },
                { label: 'Linear', value: 'linear' },
            ],
            admin: {
                condition: (data, siblingData) => siblingData?.enabled,
            },
        },
        {
            name: 'staggerChildren',
            type: 'number',
            label: 'Stagger Children (segundos)',
            defaultValue: 0,
            min: 0,
            max: 1,
            admin: {
                step: 0.05,
                description: 'Retraso entre animaciones de elementos hijos',
                condition: (data, siblingData) => siblingData?.enabled,
            },
        },
        {
            name: 'viewportAmount',
            type: 'number',
            label: 'Fracción de Visibilidad para Activar',
            defaultValue: 0.3,
            min: 0,
            max: 1,
            admin: {
                step: 0.1,
                description: 'Fracción del elemento que debe ser visible para activar la animación (0.0 a 1.0)',
                condition: (data, siblingData) => siblingData?.enabled,
            },
        },
    ],
})
