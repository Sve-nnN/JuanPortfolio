import tailwindcssAnimate from 'tailwindcss-animate'
import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  plugins: [tailwindcssAnimate, typography],
  prefix: '',
  safelist: [
    'lg:col-span-4',
    'lg:col-span-6',
    'lg:col-span-8',
    'lg:col-span-12',
    'border-border',
    'bg-card',
    'border-error',
    'bg-error/30',
    'border-success',
    'bg-success/30',
    'border-warning',
    'bg-warning/30',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        '2xl': '2rem',
        DEFAULT: '1rem',
        lg: '2rem',
        md: '2rem',
        sm: '1rem',
        xl: '2rem',
      },
      screens: {
        '2xl': '86rem',
        lg: '64rem',
        md: '48rem',
        sm: '40rem',
        xl: '80rem',
      },
    },
    extend: {
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'pulse-slow': 'pulse-slow 8s ease-in-out infinite',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      // Design-system v1.8 (DS-02): intentional z-index scale — background/base,
      // sticky/nav, dropdowns/overlays, modals/toasts. Avoids ad-hoc z-[9999].
      zIndex: {
        base: '0',
        sticky: '10',
        dropdown: '20',
        overlay: '30',
        modal: '50',
      },
      // Motion tokens mirrored from the CSS custom properties so utilities like
      // `duration-base` / `ease-standard` are available in Tailwind.
      transitionDuration: {
        fast: '150ms',
        base: '250ms',
        slow: '400ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      colors: {
        border: "oklch(var(--border) / <alpha-value>)",
        input: "oklch(var(--input) / <alpha-value>)",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "oklch(var(--background) / <alpha-value>)",
        foreground: "oklch(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "oklch(var(--popover) / <alpha-value>)",
          foreground: "oklch(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "oklch(var(--card) / <alpha-value>)",
          foreground: "oklch(var(--card-foreground) / <alpha-value>)",
        },
        success: "oklch(0.62 0.17 145 / <alpha-value>)",
        error: "oklch(0.55 0.2 25 / <alpha-value>)",
        warning: "oklch(0.79 0.15 85 / <alpha-value>)",
      },
      boxShadow: {
        'sm': '0 1px 2px 0 var(--shadow-ambient)',
        'md': '0 4px 6px -1px var(--shadow-ambient), 0 2px 4px -2px var(--shadow-directional)',
        'lg': '0 10px 15px -3px var(--shadow-ambient), 0 4px 6px -4px var(--shadow-directional)',
        'xl': '0 20px 25px -5px var(--shadow-ambient), 0 8px 10px -6px var(--shadow-directional)',
        '2xl': '0 25px 50px -12px var(--shadow-ambient)',
        'inner': 'inset 0 2px 4px 0 var(--shadow-directional)',
      },
      fontFamily: {
        mono: ['var(--font-geist-mono)'],
        // Base UI font: Khand (loaded as --font-khand)
        sans: ['var(--font-khand)', 'ui-sans-serif', 'system-ui'],
        // Headings: Array (loaded as --font-array)
        heading: ['var(--font-array)', 'serif'],
        // 'display' provides the utility class `font-display`
        display: ['var(--font-array)', 'serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.1)' },
        },
      },
      typography: () => ({
        DEFAULT: {
          css: [
            {
              '--tw-prose-body': 'var(--text)',
              '--tw-prose-headings': 'var(--text)',
              h1: {
                fontWeight: 'normal',
                marginBottom: '0.25em',
              },
              ol: {
                listStyleType: 'decimal',
                paddingLeft: '1.5em',
              },
              'ol li': {
                paddingLeft: '0.25em',
              },
              ul: {
                listStyleType: 'disc',
                paddingLeft: '1.5em',
              },
              'ul li': {
                paddingLeft: '0.25em',
              },
              // Explicit styles for nested lists within ordered lists
              'ol li ul': {
                marginTop: '0.5em', // Add some space above nested ul
                marginBottom: '0.5em', // Add some space below nested ul
                paddingLeft: '1.5em', // Indent nested ul
                listStyleType: 'disc', // Ensure disc bullet for nested ul
              },
              'ol li ul li': {
                paddingLeft: '0.25em', // Adjust padding for nested ul li
              },
              'ol li ol': { // If there are nested ordered lists
                marginTop: '0.5em',
                marginBottom: '0.5em',
                paddingLeft: '1.5em',
                listStyleType: 'lower-alpha', // Example: a., b., c. for nested ol
              },
              'ol li ol li': {
                paddingLeft: '0.25em',
              },
            },
          ],
        },
        base: {
          css: [
            {
              h1: {
                fontSize: '2.5rem',
              },
              h2: {
                fontSize: '1.25rem',
                fontWeight: 600,
              },
            },
          ],
        },
        md: {
          css: [
            {
              h1: {
                fontSize: '3.5rem',
              },
              h2: {
                fontSize: '1.5rem',
              },
            },
          ],
        },
      }),
    },
  },
}

export default config
