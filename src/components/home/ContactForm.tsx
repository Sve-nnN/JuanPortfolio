import React from 'react'
import { Send, Mail, Phone, MapPin } from 'lucide-react'
import { gaAttrs } from '@/utilities/analytics'

const ContactForm = () => {
  return (
    <div className="bg-card rounded-2xl shadow-xl overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="p-8 md:p-12">
          <span className="text-primary font-semibold">Contacto</span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-current mt-2 mb-4">
            Hablemos
          </h2>
          <p className="text-lg text-muted mb-8">
            ¿Tienes un proyecto en mente o una pregunta? Me encantaría escucharte. Rellena el
            formulario y me pondré en contacto contigo lo antes posible.
          </p>
          <form action="#" className="space-y-6" method="POST">
            <div className="relative">
              <input
                autoComplete="name"
                className="peer w-full rounded-md border-gray-300 dark:border-gray-600 bg-background-light py-3 px-4 shadow-sm focus:border-primary focus:ring-primary placeholder-transparent"
                id="name"
                name="name"
                placeholder="Tu nombre"
                required
                type="text"
              />
              <label
                className="absolute left-4 -top-3.5 text-muted text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-muted peer-placeholder-shown:top-3.5 peer-focus:-top-3.5 peer-focus:text-primary peer-focus:text-sm"
                htmlFor="name"
              >
                Tu nombre
              </label>
            </div>
            <div className="relative">
              <input
                autoComplete="email"
                className="peer w-full rounded-md border-gray-300 dark:border-gray-600 bg-background-light py-3 px-4 shadow-sm focus:border-primary focus:ring-primary placeholder-transparent"
                id="email"
                name="email"
                placeholder="Tu email"
                required
                type="email"
              />
              <label
                className="absolute left-4 -top-3.5 text-muted text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-muted peer-placeholder-shown:top-3.5 peer-focus:-top-3.5 peer-focus:text-primary peer-focus:text-sm"
                htmlFor="email"
              >
                Tu email
              </label>
            </div>
            <div className="relative">
              <textarea
                className="peer w-full rounded-md border-gray-300 dark:border-gray-600 bg-background-light py-3 px-4 shadow-sm focus:border-primary focus:ring-primary placeholder-transparent"
                id="message"
                name="message"
                placeholder="Tu mensaje"
                required
                rows={4}
              ></textarea>
              <label
                className="absolute left-4 -top-3.5 text-muted text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-muted peer-placeholder-shown:top-3.5 peer-focus:-top-3.5 peer-focus:text-primary peer-focus:text-sm"
                htmlFor="message"
              >
                Tu mensaje
              </label>
            </div>
            <div>
              <button
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                type="submit"
                {...gaAttrs('cta_click', { label: 'Enviar mensaje', location: 'home_contact' })}
              >
                <span>Enviar mensaje</span>
                <Send className="ml-2" size={18} />
              </button>
            </div>
          </form>
        </div>
        <div className="bg-primary/5 dark:bg-primary/10 p-8 md:p-12 flex flex-col justify-center">
          <h3 className="text-2xl font-bold text-current mb-6">Información de contacto</h3>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary/10 text-primary p-3 rounded-full">
                <Mail />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-current">Email</h4>
                <a
                  className="text-muted hover:text-primary transition-colors"
                  href="mailto:hola@jcangulo.com"
                  {...gaAttrs('cta_click', { label: 'email', location: 'home_contact' })}
                >
                  hola@jcangulo.com
                </a>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-primary/10 text-primary p-3 rounded-full">
                <Phone />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-current">Teléfono</h4>
                <a
                  className="text-muted hover:text-primary transition-colors"
                  href="tel:+123456789"
                  {...gaAttrs('cta_click', { label: 'phone', location: 'home_contact' })}
                >
                  +1 (234) 567-89
                </a>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-primary/10 text-primary p-3 rounded-full">
                <MapPin />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-current">Ubicación</h4>
                <p className="text-muted">Madrid, España</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactForm
