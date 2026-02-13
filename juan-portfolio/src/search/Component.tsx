'use client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React, { useState, useEffect } from 'react'
import { useDebounce } from '@/utilities/useDebounce'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/providers/Locale'

export const Search: React.FC = () => {
  const [value, setValue] = useState('')
  const router = useRouter()
  const { locale } = useLocale()
  const localePrefix = locale === 'es' ? '' : '/en'

  const debouncedValue = useDebounce(value)

  useEffect(() => {
    router.push(`${localePrefix}/search${debouncedValue ? `?q=${debouncedValue}` : ''}`)
  }, [debouncedValue, router, localePrefix])

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
        }}
      >
        <Label htmlFor="search" className="sr-only">
          {locale === 'es' ? 'Buscar' : 'Search'}
        </Label>
        <Input
          id="search"
          onChange={(event) => {
            setValue(event.target.value)
          }}
          placeholder={locale === 'es' ? 'Buscar' : 'Search'}
        />
        <button type="submit" className="sr-only">
          submit
        </button>
      </form>
    </div>
  )
}
