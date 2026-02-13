'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { useLocale } from '@/providers/Locale'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { Globe, X, Menu } from 'lucide-react'
import { domAnimation, LazyMotion, m, AnimatePresence } from 'framer-motion'
import { cn } from '@/utilities/ui'

import type { Header as HeaderType } from '@/payload-types'
import { HeaderNav } from './Nav'
import { CMSLink } from '@/components/Link'

interface HeaderClientProps {
  data: HeaderType
  locale: 'en' | 'es'
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data, locale: serverLocale }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [scrolled, setScrolled] = useState(false)
  const { setHeaderTheme } = useHeaderTheme()
  const { setLocale: setLocaleContext } = useLocale()
  const pathname = usePathname()

  // The server-provided locale is our absolute source of truth for the active state
  const currentLocale = serverLocale

  useEffect(() => {
    setHeaderTheme(null)
    setIsOpen(false)
  }, [pathname, setHeaderTheme])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleLocale = () => {
    const isCurrentlyEn = currentLocale === 'en'
    const newLocale = isCurrentlyEn ? 'es' : 'en'
    
    setLocaleContext(newLocale)
    
    let newPath = pathname
    
    // Normalize path: remove trailing slash if it's not just '/'
    const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '')

    if (newLocale === 'en') {
      // Moving ES -> EN
      if (!cleanPath.startsWith('/en')) {
        // If cleanPath is '/', result is '/en'
        // If cleanPath is '/blog', result is '/en/blog'
        newPath = cleanPath === '/' ? '/en' : `/en${cleanPath}`
      }
    } else {
      // Moving EN -> ES
      if (cleanPath.startsWith('/en')) {
        // Remove '/en' prefix. 
        // If cleanPath is '/en', result is '/'
        // If cleanPath is '/en/blog', result is '/blog'
        newPath = cleanPath.replace(/^\/en/, '') || '/'
      }
    }
    
    // Ensure we don't have double slashes
    newPath = newPath.replace(/\/+/g, '/') || '/'
    
    window.location.href = newPath
  }

  const localePrefix = currentLocale === 'es' ? '' : '/en'

  return (
    <LazyMotion features={domAnimation}>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ease-in-out',
          scrolled
            ? 'py-3 bg-background/80 dark:bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-lg'
            : 'py-6 bg-transparent border-transparent',
        )}
      >
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between">
            <Link
              href={localePrefix || '/'}
              className="group flex items-center space-x-2 text-2xl font-bold font-array tracking-tighter"
            >
              <m.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-foreground transition-colors group-hover:text-primary"
              >
                JCA
              </m.span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <HeaderNav data={data} locale={currentLocale} />
            </div>

            <div className="flex items-center space-x-4">
              {/* Language Toggle */}
              <button
                className="flex items-center space-x-2 px-4 py-2 rounded-full bg-secondary/50 hover:bg-secondary transition-all text-xs font-bold uppercase border border-white/5 hover:border-primary/30 group"
                onClick={toggleLocale}
                aria-label={currentLocale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
              >
                <Globe size={14} className="text-primary group-hover:rotate-12 transition-transform" />
                <span className="flex items-center space-x-1">
                  <span className={cn(
                    'transition-colors duration-300',
                    currentLocale === 'es' ? 'text-primary' : 'text-foreground/40'
                  )}>ES</span>
                  <span className="opacity-20">/</span>
                  <span className={cn(
                    'transition-colors duration-300',
                    currentLocale === 'en' ? 'text-primary' : 'text-foreground/40'
                  )}>EN</span>
                </span>
              </button>

              {/* CTA Button */}
              {data?.cta?.link && (
                <div className="hidden sm:block">
                  <CMSLink
                    {...data.cta.link}
                    locale={currentLocale}
                    className="px-6 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-full hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all transform hover:scale-105 active:scale-95"
                  />
                </div>
              )}

              {/* Mobile Toggle */}
              <button
                className="p-2.5 bg-secondary/50 hover:bg-secondary rounded-full md:hidden transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle Menu"
              >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isOpen && (
            <>
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[90] md:hidden"
                onClick={() => setIsOpen(false)}
              />
              <m.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 h-[100dvh] w-full max-w-sm bg-background border-l border-border z-[150] shadow-2xl md:hidden"
              >
                <div className="flex flex-col h-full p-8">
                  <div className="flex items-center justify-between mb-12">
                    <span className="text-2xl font-bold font-array tracking-tighter">JCA</span>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 bg-secondary/50 rounded-full"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="flex-1">
                    <HeaderNav data={data} mobile locale={currentLocale} onItemClick={() => setIsOpen(false)} />
                  </div>

                  <div className="mt-auto space-y-6">
                    {data?.cta?.link && (
                      <CMSLink
                        {...data.cta.link}
                        locale={currentLocale}
                        className="w-full flex items-center justify-center py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl active:scale-95 transition-transform"
                        onClick={() => setIsOpen(false)}
                      />
                    )}
                    <p className="text-center text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-50">
                      © {new Date().getFullYear()} Juan Carlos Angulo
                    </p>
                  </div>
                </div>
              </m.div>
            </>
          )}
        </AnimatePresence>
      </header>
    </LazyMotion>
  )
}
