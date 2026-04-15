import {
  Pagination as PaginationComponent,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { cn } from '@/utilities/ui'
import React from 'react'

export const Pagination: React.FC<{
  className?: string
  page: number
  totalPages: number
  locale?: 'en' | 'es'
  basePath?: string
}> = ({ className, page, totalPages, locale = 'es', basePath = '/blog' }) => {
  const localePrefix = locale === 'es' ? '' : '/en'

  const getPageUrl = (p: number) => `${localePrefix}${basePath}/page/${p}`

  const hasPrevPage = page > 1
  const hasNextPage = page < totalPages

  // Window: show first, last, and up to 1 neighbour on each side of current page.
  // Example (page=5, total=10): 1 … 4 [5] 6 … 10
  const showFirstPage = page > 2
  const showLastPage = page < totalPages - 1
  const showPrevEllipsis = page > 3
  const showNextEllipsis = page < totalPages - 2

  return (
    <div className={cn('my-12', className)}>
      <PaginationComponent>
        <PaginationContent>

          {/* ← Previous */}
          <PaginationItem>
            <PaginationPrevious
              disabled={!hasPrevPage}
              href={hasPrevPage ? getPageUrl(page - 1) : undefined}
            />
          </PaginationItem>

          {/* First page */}
          {showFirstPage && (
            <PaginationItem>
              <PaginationLink href={getPageUrl(1)}>1</PaginationLink>
            </PaginationItem>
          )}

          {showPrevEllipsis && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {/* Previous neighbour */}
          {hasPrevPage && (
            <PaginationItem>
              <PaginationLink href={getPageUrl(page - 1)}>{page - 1}</PaginationLink>
            </PaginationItem>
          )}

          {/* Current page */}
          <PaginationItem>
            <PaginationLink isActive href={getPageUrl(page)}>
              {page}
            </PaginationLink>
          </PaginationItem>

          {/* Next neighbour */}
          {hasNextPage && (
            <PaginationItem>
              <PaginationLink href={getPageUrl(page + 1)}>{page + 1}</PaginationLink>
            </PaginationItem>
          )}

          {showNextEllipsis && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {/* Last page */}
          {showLastPage && (
            <PaginationItem>
              <PaginationLink href={getPageUrl(totalPages)}>{totalPages}</PaginationLink>
            </PaginationItem>
          )}

          {/* Next → */}
          <PaginationItem>
            <PaginationNext
              disabled={!hasNextPage}
              href={hasNextPage ? getPageUrl(page + 1) : undefined}
            />
          </PaginationItem>

        </PaginationContent>
      </PaginationComponent>
    </div>
  )
}
