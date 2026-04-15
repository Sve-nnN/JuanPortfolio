import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Pagination } from '@/components/Pagination'

describe('Pagination', () => {
  describe('links SEO — real <a> hrefs', () => {
    it('prev link tiene href correcto en página 3', () => {
      render(<Pagination page={3} totalPages={10} locale="es" />)
      const prev = screen.getByLabelText('Go to previous page')
      expect(prev.tagName).toBe('A')
      expect(prev).toHaveAttribute('href', '/blog/page/2')
    })

    it('next link tiene href correcto en página 3', () => {
      render(<Pagination page={3} totalPages={10} locale="es" />)
      const next = screen.getByLabelText('Go to next page')
      expect(next.tagName).toBe('A')
      expect(next).toHaveAttribute('href', '/blog/page/4')
    })

    it('usa prefijo /en para locale inglés', () => {
      render(<Pagination page={2} totalPages={5} locale="en" />)
      const prev = screen.getByLabelText('Go to previous page')
      expect(prev).toHaveAttribute('href', '/en/blog/page/1')
    })

    it('página activa tiene aria-current="page"', () => {
      render(<Pagination page={3} totalPages={10} locale="es" />)
      const active = screen.getByRole('link', { name: '3' })
      expect(active).toHaveAttribute('aria-current', 'page')
    })

    it('links de números de página tienen href correcto', () => {
      render(<Pagination page={3} totalPages={10} locale="es" />)
      expect(screen.getByRole('link', { name: '2' })).toHaveAttribute('href', '/blog/page/2')
      expect(screen.getByRole('link', { name: '4' })).toHaveAttribute('href', '/blog/page/4')
    })
  })

  describe('estado deshabilitado', () => {
    it('Previous es span (no link) en primera página', () => {
      render(<Pagination page={1} totalPages={5} locale="es" />)
      const prev = screen.getByLabelText('Go to previous page')
      expect(prev.tagName).toBe('SPAN')
      expect(prev).toHaveAttribute('aria-disabled', 'true')
    })

    it('Next es span (no link) en última página', () => {
      render(<Pagination page={5} totalPages={5} locale="es" />)
      const next = screen.getByLabelText('Go to next page')
      expect(next.tagName).toBe('SPAN')
      expect(next).toHaveAttribute('aria-disabled', 'true')
    })

    it('prev y next son spans (no links) cuando hay una sola página', () => {
      render(<Pagination page={1} totalPages={1} locale="es" />)
      expect(screen.getByLabelText('Go to previous page').tagName).toBe('SPAN')
      expect(screen.getByLabelText('Go to next page').tagName).toBe('SPAN')
    })
  })

  describe('window de páginas', () => {
    it('muestra página 1 cuando estamos en página 5+', () => {
      render(<Pagination page={5} totalPages={10} locale="es" />)
      expect(screen.getByRole('link', { name: '1' })).toBeInTheDocument()
    })

    it('muestra última página cuando hay páginas siguientes lejanas', () => {
      render(<Pagination page={3} totalPages={10} locale="es" />)
      expect(screen.getByRole('link', { name: '10' })).toBeInTheDocument()
    })

    it('muestra ellipsis cuando hay páginas omitidas', () => {
      render(<Pagination page={5} totalPages={10} locale="es" />)
      expect(screen.getAllByText('More pages').length).toBeGreaterThan(0)
    })

    it('no muestra ellipsis en rango pequeño', () => {
      render(<Pagination page={2} totalPages={3} locale="es" />)
      expect(screen.queryByText('More pages')).toBeNull()
    })
  })

  describe('basePath personalizado', () => {
    it('usa basePath custom para construir hrefs', () => {
      render(<Pagination page={2} totalPages={5} locale="es" basePath="/case-studies" />)
      const prev = screen.getByLabelText('Go to previous page')
      expect(prev).toHaveAttribute('href', '/case-studies/page/1')
    })
  })
})
