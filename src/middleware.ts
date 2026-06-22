import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const locales = ['en', 'es']
const defaultLocale = 'es'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  // 1. Excluir archivos estáticos, API, Admin y Sitemaps
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/sitemap') ||
    pathname.includes('-sitemap.xml') ||
    pathname.includes('.')
  ) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // 1.5 El locale por defecto (es) se sirve SIN prefijo en la raíz. Cualquier
  // acceso con prefijo /es es un duplicado de la URL canónica: redirigir 301 a
  // la versión sin prefijo para consolidar. SEO audit jun-2026, issue #32.
  if (pathname === `/${defaultLocale}` || pathname.startsWith(`/${defaultLocale}/`)) {
    const url = request.nextUrl.clone()
    url.pathname =
      pathname === `/${defaultLocale}` ? '/' : pathname.slice(`/${defaultLocale}`.length)
    return NextResponse.redirect(url, 301)
  }

  // 2. Verificar si la ruta ya tiene un locale soportado
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // 3. Si es la raíz "/", dejamos que Next.js use src/app/(frontend)/page.tsx
  if (pathname === '/') {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // 4. Para cualquier otra ruta sin prefijo (ej: /blog/cs-fundamentals)
  // la reescribimos internamente a /es/blog/cs-fundamentals
  // Esto hace que coincida con src/app/(frontend)/[locale]/...
  const url = request.nextUrl.clone()
  url.pathname = `/${defaultLocale}${pathname}`
  
  return NextResponse.rewrite(url, {
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    // Ejecutar en todas las rutas excepto las internas de Next.js y archivos estáticos
    '/((?!_next|api|admin|favicon.ico|sitemap|.*-sitemap.xml|.*\\..*).*)',
  ],
}
