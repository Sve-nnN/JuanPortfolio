'use client'
import { useEffect } from 'react'

export default function TOCClient() {
  useEffect(() => {
    const headings = Array.from(
      document.querySelectorAll('article .prose h2, article .prose h3, article .prose h4'),
    ) as HTMLElement[]

    // Add id if missing and set scroll-margin-top so anchored headings don't hide under the navbar
    headings.forEach((h) => {
      if (!h.id) {
        const text = h.textContent || 'heading'
        const id = text
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
        h.id = id
      }
      // Ensure there's enough top offset when the browser jumps to the anchor
      h.style.scrollMarginTop = '6rem'
    })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id
          const tocLink = document.querySelector(`a[href="#${id}"]`)
          if (tocLink) {
            // Use utility classes for active state; add/remove classes for both light and dark
            if (entry.isIntersecting) {
              tocLink.classList.add('text-primary')
              tocLink.classList.add('font-semibold')
            } else {
              tocLink.classList.remove('text-primary')
              tocLink.classList.remove('font-semibold')
            }
          }
        })
      },
      { root: null, rootMargin: '0px 0px -60% 0px', threshold: 0 },
    )

    headings.forEach((h) => observer.observe(h))

    return () => observer.disconnect()
  }, [])

  return null
}
