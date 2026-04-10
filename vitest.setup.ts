import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    pathname: '/',
    locale: 'en',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useLocale: () => 'en',
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    ...props
  }: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img src={src} alt={alt} {...props} />
  },
}))

// Mock next/link
vi.mock('next/link', () => {
  return {
    default: ({ children, href, ...props }: any) => {
      return (
        <a href={href} {...props}>
          {children}
        </a>
      )
    },
  }
})
