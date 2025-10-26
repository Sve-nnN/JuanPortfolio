export type Locale = 'en' | 'es'

type Translations = Record<string, Record<string, string>>

const translations: Translations = {
  en: {
    'header.closeMenu': 'Close',
    'home.hero.badge': 'Portfolio',
    'home.hero.title': 'Hello, I am Juan',
    'home.hero.subtitle': 'Designer & Developer',
    'home.hero.description': 'I build beautiful things.',
    'home.hero.contact': 'Contact',
    'home.hero.work': 'Work',
    'home.work.title': 'Selected work',
    'home.work.description': 'A few projects I worked on.',
    'home.work.viewAll': 'View all',
    'home.blog.title': 'From the blog',
    'home.blog.description': 'Latest articles and news',
    'home.blog.visitBlog': 'Visit blog',
  },
  es: {
    'header.closeMenu': 'Cerrar',
    'home.hero.badge': 'Portafolio',
    'home.hero.title': 'Hola, soy Juan',
    'home.hero.subtitle': 'Diseñador y Desarrollador',
    'home.hero.description': 'Construyo cosas hermosas.',
    'home.hero.contact': 'Contacto',
    'home.hero.work': 'Proyectos',
    'home.work.title': 'Trabajo seleccionado',
    'home.work.description': 'Algunos proyectos en los que trabajé.',
    'home.work.viewAll': 'Ver todo',
    'home.blog.title': 'Del blog',
    'home.blog.description': 'Últimos artículos y noticias',
    'home.blog.visitBlog': 'Visitar blog',
  },
}

export const t = (locale: Locale | string, key: string, fallback?: string) => {
  const l = locale === 'en' || locale === 'es' ? (locale as Locale) : 'es'
  return translations[l][key] || fallback || key
}

export default t
