export type Locale = 'en' | 'es'

type Translations = Record<string, Record<string, string>>

const translations: Translations = {
  en: {
    'header.closeMenu': 'Close',
    'home.hero.badge': 'Senior Software Engineer & Technical SEO Specialist',
    'home.hero.title': 'Juan Carlos Angulo: Engineering Scalable, Search-Optimized Digital Ecosystems',
    'home.hero.subtitle': 'Full-Stack Authority & Core Web Vitals Expert',
    'home.hero.description': 'Specializing in high-performance architectures using Next.js 15, Payload CMS, and Cloud Native solutions. I bridge the gap between complex engineering and granular search engine optimization.',
    'home.hero.contact': 'Start Project',
    'home.hero.work': 'Case Studies',
    'home.work.title': 'Technical Case Studies',
    'home.work.description': 'A deep dive into architectural challenges, performance hurdles, and SEO growth strategies for enterprise-grade projects.',
    'home.work.viewAll': 'Explore Full Portfolio',
    'home.blog.title': 'The Technical Standard',
    'home.blog.description': 'In-depth documentation on full-stack patterns, technical SEO audits, and modern web performance optimization.',
    'home.blog.visitBlog': 'Read Engineering Blog',
  },
  es: {
    'header.closeMenu': 'Cerrar',
    'home.hero.badge': 'Ingeniero de Software Senior y Especialista en SEO Técnico',
    'home.hero.title': 'Juan Carlos Angulo: Arquitecto de Ecosistemas Digitales Escalables y Optimizados',
    'home.hero.subtitle': 'Autoridad Full-Stack y Experto en Core Web Vitals',
    'home.hero.description': 'Especializado en arquitecturas de alto rendimiento con Next.js 15, Payload CMS y soluciones Cloud Native. Unifico la ingeniería compleja con la optimización granular para motores de búsqueda.',
    'home.hero.contact': 'Iniciar Proyecto',
    'home.hero.work': 'Casos de Estudio',
    'home.work.title': 'Documentación de Proyectos',
    'home.work.description': 'Análisis profundo de retos arquitectónicos, hitos de rendimiento y estrategias de crecimiento SEO en proyectos de nivel empresarial.',
    'home.work.viewAll': 'Explorar Portafolio Completo',
    'home.blog.title': 'El Estándar Técnico',
    'home.blog.description': 'Documentación detallada sobre patrones full-stack, auditorías de SEO técnico y optimización de rendimiento web moderno.',
    'home.blog.visitBlog': 'Leer Blog de Ingeniería',
  },
}

export const t = (locale: Locale | string, key: string, fallback?: string) => {
  const l = locale === 'en' || locale === 'es' ? (locale as Locale) : 'es'
  return translations[l][key] || fallback || key
}

export default t
