import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'
import type { Footer } from '@/payload-types'

export async function Footer() {
  const footerData: Footer = await getCachedGlobal('footer', 1)()

  const navItems = footerData?.navItems || []

  return (
    <footer className="bg-card dark:bg-card-dark text-muted">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-array font-bold text-current mb-4">JCA</h3>
            <p className="text-sm">
              Desarrollador Web &amp; Especialista SEO. Creando soluciones digitales de alto
              impacto.
            </p>
            <div className="flex space-x-4 mt-6">
              <a className="text-muted hover:text-primary transition-colors" href="#">
                GitHub
              </a>
              <a className="text-muted hover:text-primary transition-colors" href="#">
                LinkedIn
              </a>
              <a className="text-muted hover:text-primary transition-colors" href="#">
                Twitter
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-current tracking-wider uppercase mb-4">
              Navegación
            </h3>
            <ul className="space-y-2">
              <li>
                <a className="hover:text-primary transition-colors" href="#about">
                  Sobre mí
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#work">
                  Casos de Estudio
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#blog">
                  Blog
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#contact">
                  Contacto
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-current tracking-wider uppercase mb-4">
              Servicios
            </h3>
            <ul className="space-y-2">
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Desarrollo Web
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Optimización SEO
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Diseño Responsivo
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Consultoría Web
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-current tracking-wider uppercase mb-4">
              Legal
            </h3>
            <ul className="space-y-2">
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Política de Privacidad
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Términos de Servicio
                </a>
              </li>
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Política de Cookies
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm">
          <p>© 2023 Juan Carlos Angulo. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
