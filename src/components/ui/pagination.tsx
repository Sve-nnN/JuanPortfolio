import type { ButtonProps } from '@/components/ui/button'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

const Pagination = ({ className, ...props }: React.ComponentProps<'nav'>) => (
  <nav
    aria-label="pagination"
    className={cn('mx-auto flex w-full justify-center', className)}
    role="navigation"
    {...props}
  />
)

const PaginationContent: React.FC<
  { ref?: React.Ref<HTMLUListElement> } & React.HTMLAttributes<HTMLUListElement>
> = ({ className, ref, ...props }) => (
  <ul className={cn('flex flex-row items-center gap-1', className)} ref={ref} {...props} />
)

const PaginationItem: React.FC<
  { ref?: React.Ref<HTMLLIElement> } & React.HTMLAttributes<HTMLLIElement>
> = ({ className, ref, ...props }) => <li className={cn('', className)} ref={ref} {...props} />

type PaginationLinkProps = {
  isActive?: boolean
  href?: string
  disabled?: boolean
} & Pick<ButtonProps, 'size'> &
  Omit<React.ComponentProps<'a'>, 'href'>

// Renders as <Link> when href is provided (crawlable), <span> when disabled.
// This is critical for SEO — paginated pages must be reachable via real anchor tags.
const PaginationLink = ({
  className,
  isActive,
  size = 'icon',
  href,
  disabled,
  children,
  ...props
}: PaginationLinkProps) => {
  const classes = cn(
    buttonVariants({ size, variant: isActive ? 'outline' : 'ghost' }),
    disabled && 'pointer-events-none opacity-50',
    className,
  )

  if (disabled || !href) {
    return (
      <span
        aria-current={isActive ? 'page' : undefined}
        aria-disabled={disabled ? 'true' : undefined}
        className={classes}
        {...(props as React.HTMLAttributes<HTMLSpanElement>)}
      >
        {children}
      </span>
    )
  }

  return (
    <Link
      aria-current={isActive ? 'page' : undefined}
      className={classes}
      href={href}
      {...(props as React.ComponentProps<typeof Link>)}
    >
      {children}
    </Link>
  )
}

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    className={cn('gap-1 pl-2.5', className)}
    size="default"
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)

const PaginationNext = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    className={cn('gap-1 pr-2.5', className)}
    size="default"
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)

const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <span
    aria-hidden
    className={cn('flex h-9 w-9 items-center justify-center', className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
