'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/providers/Locale'
import { useDebounce } from '@/utilities/useDebounce'
import { trackEvent } from '@/utilities/analytics'
import { Search as SearchIcon, X, Loader2 } from 'lucide-react'
import Link from 'next/link'

type SearchResult = {
  id: string
  title?: string
  slug?: string
  meta?: {
    title?: string
    description?: string
  }
  doc?: {
    value?: {
      slug?: string
    }
  }
}

export const NavSearch: React.FC<{ mobile?: boolean; onItemClick?: () => void }> = ({
  mobile,
  onItemClick,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { locale } = useLocale()
  const localePrefix = locale === 'es' ? '' : '/en'

  const debouncedValue = useDebounce(value, 300)

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedValue.trim()) {
        setResults([])
        return
      }
      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/autocomplete?q=${encodeURIComponent(debouncedValue)}&locale=${locale}`,
        )
        if (response.ok) {
          const data = await response.json()
          setResults(data.results || [])
        }
      } catch (err) {
        console.error('Failed to fetch autocomplete results', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [debouncedValue, locale])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) {
      setIsOpen(false)
      onItemClick?.()
      trackEvent('search', { search_term: value.trim() })
      router.push(`${localePrefix}/search?q=${encodeURIComponent(value.trim())}`)
    }
  }

  const getResultUrl = (result: SearchResult) => {
    if (result.doc?.value?.slug) {
      return `${localePrefix}/blog/${result.doc.value.slug}`
    }
    return `${localePrefix}/blog/${result.slug || ''}`
  }

  return (
    <div className={`relative ${mobile ? 'w-full' : 'w-auto'}`} ref={searchRef}>
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <SearchIcon
          className={`absolute left-3 text-muted-foreground w-4 h-4 ${mobile ? 'w-5 h-5' : ''}`}
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            if (!isOpen) setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={locale === 'es' ? 'Buscar...' : 'Search...'}
          className={`bg-secondary/50 border border-border/50 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-all duration-300 ${
            mobile ? 'w-full py-4 pl-12 pr-10 text-lg' : 'w-40 focus:w-60 py-1.5 pl-9 pr-8 text-sm'
          }`}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue('')
              setResults([])
              inputRef.current?.focus()
            }}
            className={`absolute right-3 text-muted-foreground hover:text-foreground`}
          >
            <X className={mobile ? 'w-5 h-5' : 'w-3 h-3'} />
          </button>
        )}
        <button type="submit" className="sr-only">
          Submit
        </button>
      </form>

      {isOpen && value.trim().length > 0 && (
        <div
          className={`absolute z-50 bg-background border border-border rounded-xl shadow-lg overflow-hidden flex flex-col ${
            mobile
              ? 'top-full left-0 right-0 mt-2 max-h-[50vh]'
              : 'top-full right-0 mt-2 w-72 max-h-96'
          }`}
        >
          {isLoading && (
            <div className="flex items-center justify-center p-4 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">{locale === 'es' ? 'Buscando...' : 'Searching...'}</span>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="overflow-y-auto">
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={getResultUrl(result)}
                  className="block px-4 py-3 hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0"
                  onClick={() => {
                    setIsOpen(false)
                    onItemClick?.()
                  }}
                >
                  <p className="font-medium text-sm text-foreground line-clamp-1">
                    {result.title || result.meta?.title}
                  </p>
                  {result.meta?.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                      {result.meta.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}

          {!isLoading && results.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {locale === 'es' ? 'No se encontraron resultados' : 'No results found'}
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="p-2 border-t border-border/50 bg-secondary/20">
              <button
                onClick={handleSubmit}
                className="w-full text-center text-xs text-primary font-medium p-1.5 hover:underline"
              >
                {locale === 'es' ? 'Ver todos los resultados' : 'View all results'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
