'use client'

import React, { useRef, useState } from 'react'
import {
  Send,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import type { ContactFormBlock as ContactFormBlockType } from '@/payload-types'
import { sendContactEmail } from '@/app/(frontend)/[locale]/actions/sendEmail'
import { TurnstileWidget } from '@/components/Turnstile'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'

const iconMap = {
  mail: Mail,
  phone: Phone,
  'map-pin': MapPin,
  linkedin: Linkedin,
  github: Github,
}

export const ContactFormBlockComponent: React.FC<ContactFormBlockType & { locale?: 'en' | 'es' }> = (props) => {
  const { eyebrow, title, description, submitLabel = 'Enviar mensaje', contactInfo, locale = 'es' } = props

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await sendContactEmail(formData)

      if (result.success) {
        setIsSuccess(true)
        formRef.current?.reset()
      } else {
        setErrorMessage(result.error || (locale === 'es' ? 'Ocurrió un error inesperado.' : 'An unexpected error occurred.'))
      }
    } catch (err) {
      console.error(err)
      setErrorMessage(locale === 'es' ? 'Error de conexión. Inténtalo de nuevo.' : 'Connection error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" className="py-24 md:py-32 overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="bg-card/50 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-border/50">
            <div className="grid grid-cols-1 lg:grid-cols-5">
              {/* Form Section */}
              <div className="lg:col-span-3 p-8 md:p-14 lg:p-16">
                <div className="max-w-md mx-auto lg:mx-0">
                  {eyebrow && (
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase rounded-full mb-4">
                      {eyebrow}
                    </span>
                  )}
                  {title && (
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mt-2 mb-6 tracking-tight leading-tight">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                      {description}
                    </p>
                  )}

                  {isSuccess ? (
                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-10 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="bg-primary/20 p-4 rounded-full mb-6">
                        <CheckCircle2 className="text-primary w-12 h-12" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground mb-3">
                        {locale === 'es' ? '¡Mensaje recibido!' : 'Message received!'}
                      </h3>
                      <p className="text-muted-foreground mb-8">
                        {locale === 'es' 
                          ? 'Gracias por ponerte en contacto. Te responderé en menos de 24 horas.' 
                          : 'Thanks for getting in touch. I will get back to you in less than 24 hours.'}
                      </p>
                      <Button
                        onClick={() => setIsSuccess(false)}
                        variant="outline"
                        className="rounded-full px-8"
                      >
                        {locale === 'es' ? 'Enviar otro mensaje' : 'Send another message'}
                      </Button>
                    </div>
                  ) : (
                    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name Field */}
                        <div className="group">
                          <label
                            htmlFor="name"
                            className={cn(
                              'block text-sm font-semibold mb-2 transition-colors duration-200',
                              focusedField === 'name'
                                ? 'text-primary'
                                : 'text-muted-foreground group-hover:text-foreground',
                            )}
                          >
                            {locale === 'es' ? 'Nombre completo' : 'Full name'}
                          </label>
                          <input
                            autoComplete="name"
                            className="w-full bg-background border-b border-border py-2 focus:border-primary outline-none transition-all duration-300 placeholder:text-muted/30"
                            id="name"
                            name="name"
                            onFocus={() => setFocusedField('name')}
                            onBlur={() => setFocusedField(null)}
                            placeholder={locale === 'es' ? 'Ej. Juan Pérez' : 'e.g. John Doe'}
                            required
                            type="text"
                          />
                        </div>

                        {/* Email Field */}
                        <div className="group">
                          <label
                            htmlFor="email"
                            className={cn(
                              'block text-sm font-semibold mb-2 transition-colors duration-200',
                              focusedField === 'email'
                                ? 'text-primary'
                                : 'text-muted-foreground group-hover:text-foreground',
                            )}
                          >
                            {locale === 'es' ? 'Correo electrónico' : 'Email address'}
                          </label>
                          <input
                            autoComplete="email"
                            className="w-full bg-background border-b border-border py-2 focus:border-primary outline-none transition-all duration-300 placeholder:text-muted/30"
                            id="email"
                            name="email"
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="tu@email.com"
                            required
                            type="email"
                          />
                        </div>
                      </div>

                      {/* Message Field */}
                      <div className="group">
                        <label
                          htmlFor="message"
                          className={cn(
                            'block text-sm font-semibold mb-2 transition-colors duration-200',
                            focusedField === 'message'
                              ? 'text-primary'
                              : 'text-muted-foreground group-hover:text-foreground',
                          )}
                        >
                          {locale === 'es' ? 'Tu mensaje' : 'Your message'}
                        </label>
                        <textarea
                          className="w-full bg-background border-b border-border py-2 focus:border-primary outline-none transition-all duration-300 min-h-[100px] resize-none placeholder:text-muted/30"
                          id="message"
                          name="message"
                          onFocus={() => setFocusedField('message')}
                          onBlur={() => setFocusedField(null)}
                          placeholder={locale === 'es' ? '¿En qué puedo ayudarte?' : 'How can I help you?'}
                          required
                          rows={3}
                        ></textarea>
                      </div>

                      {/* CAPTCHA - Minimal Styling */}
                      <div className="pt-2 opacity-90 hover:opacity-100 transition-opacity">
                        <TurnstileWidget />
                      </div>

                      {errorMessage && (
                        <div className="flex items-start gap-3 text-destructive bg-destructive/5 p-4 rounded-xl border border-destructive/10 text-sm animate-in fade-in slide-in-from-top-1">
                          <AlertCircle className="shrink-0 mt-0.5" size={18} />
                          <span>{errorMessage}</span>
                        </div>
                      )}

                      <div className="pt-2">
                        <Button
                          disabled={isSubmitting}
                          size="lg"
                          className="w-full md:w-auto min-w-[200px] rounded-full group bg-primary hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
                          type="submit"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 animate-spin" size={20} />
                              <span>{locale === 'es' ? 'Enviando...' : 'Sending...'}</span>
                            </>
                          ) : (
                            <>
                              <span>{submitLabel}</span>
                              <Send className="ml-2 w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Sidebar Section */}
              <div className="lg:col-span-2 bg-primary dark:bg-primary p-8 md:p-14 lg:p-16 flex flex-col justify-between text-primary-foreground relative overflow-hidden">
                {/* Decorative Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                  <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full border-[40px] border-white" />
                  <div className="absolute -left-10 bottom-1/4 w-40 h-40 rounded-full border-[20px] border-white" />
                </div>

                <div className="relative z-10">
                  <h3 className="text-3xl font-display font-bold mb-8 tracking-tight">
                    {locale === 'es' ? 'Charlemos sobre tu próximo proyecto' : 'Let\'s chat about your next project'}
                  </h3>
                  <p className="text-primary-foreground/80 mb-12 text-lg font-medium max-w-xs">
                    {locale === 'es' 
                      ? 'Estoy disponible para proyectos freelance y colaboraciones. ¡Hablemos!' 
                      : 'I am available for freelance projects and collaborations. Let\'s talk!'}
                  </p>

                  {contactInfo && contactInfo.length > 0 && (
                    <div className="space-y-8">
                      {contactInfo.map((info, i) => {
                        const IconComponent = iconMap[info.icon as keyof typeof iconMap] || Mail
                        return (
                          <div key={i} className="flex items-center space-x-5 group">
                            <div className="bg-white/10 p-3.5 rounded-2xl group-hover:bg-white group-hover:text-primary transition-all duration-500 shadow-sm border border-white/5">
                              <IconComponent size={22} className="stroke-[2.5]" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase tracking-widest font-bold text-white/50 mb-1">
                                {info.title}
                              </span>
                              {info.href ? (
                                <a
                                  className="text-lg font-bold hover:text-white transition-colors decoration-white/20 underline-offset-4 decoration-1 decoration-transparent hover:decoration-white/20"
                                  href={info.href}
                                >
                                  {info.value}
                                </a>
                              ) : (
                                <span className="text-lg font-bold">{info.value}</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Social Proof / Callout */}
                <div className="mt-16 relative z-10 pt-10 border-t border-white/10">
                  <div className="flex items-center space-x-3 text-sm font-medium">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full border-2 border-primary bg-white/20"
                        />
                      ))}
                    </div>
                    <span className="text-white/70 italic text-xs">
                      {locale === 'es' ? 'Más de 50 proyectos completados' : 'Over 50 projects completed'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
