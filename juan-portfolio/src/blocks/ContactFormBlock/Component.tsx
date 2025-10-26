import React from 'react'
import { Send, Mail, Phone, MapPin, Linkedin, Github } from 'lucide-react'
import type { ContactFormBlock } from '@/payload-types'

const iconMap = {
  mail: Mail,
  phone: Phone,
  'map-pin': MapPin,
  linkedin: Linkedin,
  github: Github,
}

export const ContactFormBlockComponent: React.FC<ContactFormBlock> = (props) => {
  const { eyebrow, title, description, submitLabel = 'Enviar mensaje', contactInfo } = props

  return (
    <section id="contact" className="py-20 md:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Form */}
            <div className="p-8 md:p-12">
              {eyebrow && <span className="text-primary font-semibold">{eyebrow}</span>}
              {title && (
                <h2 className="text-3xl md:text-4xl font-display font-bold text-current mt-2 mb-4">
                  {title}
                </h2>
              )}
              {description && <p className="text-lg text-muted mb-8">{description}</p>}

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
                  >
                    <span>{submitLabel}</span>
                    <Send className="ml-2" size={18} />
                  </button>
                </div>
              </form>
            </div>

            {/* Contact Info */}
            <div className="bg-primary/5 dark:bg-primary/10 p-8 md:p-12 flex flex-col justify-center">
              <h3 className="text-2xl font-bold text-current mb-6">Información de contacto</h3>
              {contactInfo && contactInfo.length > 0 && (
                <div className="space-y-6">
                  {contactInfo.map((info, i) => {
                    const IconComponent = iconMap[info.icon as keyof typeof iconMap] || Mail
                    return (
                      <div key={i} className="flex items-start space-x-4">
                        <div className="bg-primary/10 text-primary p-3 rounded-full">
                          <IconComponent />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-current">{info.title}</h4>
                          {info.href ? (
                            <a
                              className="text-muted hover:text-primary transition-colors"
                              href={info.href}
                            >
                              {info.value}
                            </a>
                          ) : (
                            <p className="text-muted">{info.value}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
