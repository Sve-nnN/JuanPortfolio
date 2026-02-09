'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { useLocale } from '@/providers/Locale'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { ChevronDown, Menu, Globe } from 'lucide-react'
import { t } from '@/i18n/translations'

import type { Header } from '@/payload-types'

// Logo moved to text initials
import { HeaderNav } from './Nav'
import { CMSLink } from '@/components/Link'

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isLangOpen, setIsLangOpen] = useState<boolean>(false)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const { locale, setLocale } = useLocale()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [isOpen])

  return (
    <header
      className="sticky top-0 z-50 bg-background/70 dark:bg-black/80 backdrop-blur-md border-b border-white/10 dark:border-white/5 transition-colors duration-300"
      {...(theme ? { 'data-theme': theme } : {})}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold font-array text-current">
            JCA
          </Link>
          <div className="hidden md:flex items-center">
            <HeaderNav data={data} />
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <button
                className="flex items-center space-x-1 text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setIsLangOpen(!isLangOpen)}
                aria-label="Change language"
              >
                <Globe size={16} />
                <span className="uppercase">{locale}</span>
                <ChevronDown size={16} />
              </button>
              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 rounded-t-md"
                    onClick={() => {
                      setLocale('en')
                      setIsLangOpen(false)
                    }}
                  >
                    English
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 rounded-b-md"
                    onClick={() => {
                      setLocale('es')
                      setIsLangOpen(false)
                    }}
                  >
                    Español
                  </button>
                </div>
              )}
            </div>

            {/* Primary CTA Button */}
            {data?.cta?.link && (
              <CMSLink
                {...data.cta.link}
                className="hidden md:inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              />
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2"
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              onClick={() => setIsOpen((v) => !v)}
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu panel */}
      <div
        id="mobile-menu"
        className={`md:hidden fixed inset-0 z-[100] transition-all overflow-x-hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        aria-hidden={!isOpen}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsOpen(false)
        }}
      >
        <div className="absolute inset-0 bg-black/60" onClick={() => setIsOpen(false)} />
        <div
          className={`absolute right-0 top-0 h-full w-80 bg-white dark:bg-slate-900 text-current dark:text-white shadow-2xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <Link href="/" className="text-xl font-bold font-array text-current">
                JCA
              </Link>
              <button
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
                onClick={() => setIsOpen(false)}
                aria-label={t(locale, 'header.closeMenu')}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            {/* Primary CTA in mobile menu */}
            {data?.cta?.link && (
              <CMSLink
                {...data.cta.link}
                className="w-full inline-flex items-center justify-center px-6 py-3.5 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-lg mb-6"
                onClick={() => setIsOpen(false)}
              />
            )}

            <div className="flex-1 overflow-auto" tabIndex={-1}>
              <HeaderNav data={data} mobile onItemClick={() => setIsOpen(false)} />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
