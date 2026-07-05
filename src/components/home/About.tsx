import React from 'react'
import { Zap, Monitor, Lightbulb, TrendingUp, ArrowRight } from 'lucide-react'
import type { Page } from '@/payload-types'

const About = ({ page }: { page?: Partial<Page> }) => {
  return (
    <section className="py-20 md:py-28" id="about">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-primary font-semibold">Sobre mí</span>
            <h2 className="text-section font-display font-bold text-current mt-2 mb-6">
              Conoce al desarrollador
            </h2>
            <p className="text-muted mb-4 text-lg">
              {page?.meta?.description ||
                '¡Hola! Soy Juan Carlos, un desarrollador web apasionado por crear experiencias digitales excepcionales.'}
            </p>
            <p className="text-muted mb-6 text-lg">
              Mi filosofía se centra en la colaboración y la transparencia. Me sumerjo en cada
              proyecto para entender a fondo tus objetivos y traducirlos en un producto digital que
              genere resultados tangibles.
            </p>
            <a
              className="text-primary font-semibold hover:underline flex items-center"
              href="#contact"
            >
              <span>Hablemos de tu proyecto</span>
              <ArrowRight className="ml-1" size={18} />
            </a>
          </div>
          <div className="grid grid-cols-2 grid-rows-2 gap-4">
            <div className="p-6 bg-card rounded-lg shadow-md flex flex-col items-center text-center">
              <Zap className="text-primary mb-3" size={36} />
              <h3 className="text-lg font-bold text-current mb-1">Rendimiento</h3>
              <p className="text-sm text-muted">
                Sitios web ultrarrápidos para una experiencia de usuario superior.
              </p>
            </div>
            <div className="p-6 bg-card rounded-lg shadow-md flex flex-col items-center text-center">
              <Monitor className="text-primary mb-3" size={36} />
              <h3 className="text-lg font-bold text-current mb-1">Responsivo</h3>
              <p className="text-sm text-muted">
                Adaptabilidad perfecta a todos los dispositivos y pantallas.
              </p>
            </div>
            <div className="p-6 bg-card rounded-lg shadow-md flex flex-col items-center text-center">
              <Lightbulb className="text-primary mb-3" size={36} />
              <h3 className="text-lg font-bold text-current mb-1">Intuitivo</h3>
              <p className="text-sm text-muted">
                Interfaces limpias y fáciles de usar que guían al usuario.
              </p>
            </div>
            <div className="p-6 bg-card rounded-lg shadow-md flex flex-col items-center text-center">
              <TrendingUp className="text-primary mb-3" size={36} />
              <h3 className="text-lg font-bold text-current mb-1">SEO</h3>
              <p className="text-sm text-muted">
                Optimización para motores de búsqueda desde el código.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
