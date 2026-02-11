'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { useLocale } from '@/providers/Locale'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { Globe, X, Menu, ChevronDown } from 'lucide-react'
import { domAnimation, LazyMotion, m, AnimatePresence } from 'framer-motion'
import { cn } from '@/utilities/ui'

import type { Header as HeaderType } from '@/payload-types'
import { HeaderNav } from './Nav'
import { CMSLink } from '@/components/Link'

interface HeaderClientProps {
  data: HeaderType
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isLangOpen, setIsLangOpen] = useState<boolean>(false)
  const [scrolled, setScrolled] = useState(false)
  const { setHeaderTheme } = useHeaderTheme()
  const { locale, setLocale } = useLocale()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
    setIsOpen(false)
    setIsLangOpen(false)
  }, [pathname, setHeaderTheme])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

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
              href="/"
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
              <HeaderNav data={data} />
            </div>

            <div className="flex items-center space-x-4">
              {/* Language Switcher */}
              <div className="relative">
                <button
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary transition-all text-xs font-semibold uppercase"
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  aria-label="Change language"
                >
                  <Globe size={14} className="text-primary" />
                  <span>{locale}</span>
                  <ChevronDown
                    size={14}
                    className={cn('transition-transform duration-300', isLangOpen && 'rotate-180')}
                  />
                </button>

                <AnimatePresence>
                  {isLangOpen && (
                    <m.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-36 bg-background/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl overflow-hidden z-50 p-1"
                    >
                      {[
                        { id: 'en', label: 'English' },
                        { id: 'es', label: 'Español' },
                      ].map((lang) => (
                        <button
                          key={lang.id}
                          className={cn(
                            'w-full text-left px-4 py-2.5 text-sm font-medium transition-colors rounded-xl',
                            locale === lang.id
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-secondary text-foreground/70 hover:text-foreground',
                          )}
                          onClick={() => {
                            setLocale(lang.id as 'en' | 'es')
                            setIsLangOpen(false)
                          }}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </m.div>
                  )}
                </AnimatePresence>
              </div>

              {/* CTA Button */}
              {data?.cta?.link && (
                <div className="hidden sm:block">
                  <CMSLink
                    {...data.cta.link}
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
                    <HeaderNav data={data} mobile onItemClick={() => setIsOpen(false)} />
                  </div>

                  <div className="mt-auto space-y-6">
                    {data?.cta?.link && (
                      <CMSLink
                        {...data.cta.link}
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
