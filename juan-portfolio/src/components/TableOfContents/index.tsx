'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { Heading } from '@/utilities/extractHeadings'
import { cn } from '@/utilities/ui'

interface TableOfContentsProps {
  headings: Heading[]
  variant?: 'desktop' | 'mobile'
}

interface HeadingGroup {
  h2: Heading
  h3s: Heading[]
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  headings,
  variant = 'desktop',
}) => {
  const [activeId, setActiveId] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const shouldReduceMotion = useReducedMotion()

  const H3_LIMIT = 3 // Show only first 3 H3s per H2

  // Group headings by H2 sections
  const groupedHeadings = useMemo(() => {
    const groups: HeadingGroup[] = []
    let currentGroup: HeadingGroup | null = null

    headings.forEach((heading) => {
      if (heading.level === 2) {
        // Start new H2 group
        if (currentGroup) {
          groups.push(currentGroup)
        }
        currentGroup = { h2: heading, h3s: [] }
      } else if (heading.level === 3 && currentGroup) {
        // Add H3 to current group
        currentGroup.h3s.push(heading)
      }
      // Ignore H4+ for TOC (they're not displayed)
    })

    // Push last group
    if (currentGroup) {
      groups.push(currentGroup)
    }

    return groups
  }, [headings])

  // Toggle expanded state for a specific H2 section
  const toggleSection = useCallback((h2Id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(h2Id)) {
        next.delete(h2Id)
      } else {
        next.add(h2Id)
      }
      return next
    })
  }, [])

  // Scroll spy: track which heading is currently visible
  useEffect(() => {
    if (!headings || headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
            // Update URL hash without jumping
            if (window.history.replaceState) {
              window.history.replaceState(null, '', `#${entry.target.id}`)
            }
          }
        })
      },
      {
        rootMargin: '-100px 0px -80% 0px', // Active when in top 20% of viewport
        threshold: 0,
      },
    )

    // Observe all heading elements
    headings.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      observer.disconnect()
    }
  }, [headings])

  // Handle click on TOC link
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault()
      const target = document.getElementById(id)
      if (target) {
        const offset = 100 // Offset for fixed header
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - offset
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        })
        setActiveId(id)
        // Update URL
        window.history.pushState(null, '', `#${id}`)
        // Close mobile menu after click
        if (variant === 'mobile') {
          setIsExpanded(false)
        }
      }
    },
    [variant],
  )

  if (!headings || headings.length === 0) return null

  // Render a single heading link
  const renderHeadingLink = (h: Heading, paddingClass: string) => {
    const isActive = activeId === h.id
    return (
      <li key={h.id} className={paddingClass}>
        <a
          href={`#${h.id}`}
          onClick={(e) => handleClick(e, h.id)}
          aria-current={isActive ? 'location' : undefined}
          className={cn(
            'block px-2 py-2 rounded-md transition-all duration-200',
            'hover:text-primary hover:bg-primary/5',
            'focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
            isActive ? 'text-primary font-semibold' : 'text-muted-foreground font-normal',
          )}
        >
          <motion.span
            animate={{
              x: isActive ? 4 : 0,
            }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.2,
            }}
            className="block"
          >
            {h.text}
          </motion.span>
        </a>
      </li>
    )
  }

  // Mobile variant: collapsible
  if (variant === 'mobile') {
    return (
      <div className="mb-6">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors"
          aria-expanded={isExpanded}
          aria-controls="mobile-toc"
        >
          <span className="text-sm font-semibold flex items-center gap-2">
            <span className="w-1 h-4 bg-primary rounded"></span>
            Contenido
          </span>
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </motion.svg>
        </button>

        <motion.div
          id="mobile-toc"
          initial={false}
          animate={{
            height: isExpanded ? 'auto' : 0,
            opacity: isExpanded ? 1 : 0,
          }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.3,
            ease: 'easeInOut',
          }}
          className="overflow-hidden"
        >
          <nav aria-label="Tabla de contenido" className="pt-2">
            <ul className="space-y-1 text-sm">
              {groupedHeadings.map((group) => {
                const isGroupExpanded = expandedSections.has(group.h2.id)
                const hasMoreThanLimit = group.h3s.length > H3_LIMIT
                const visibleH3s = isGroupExpanded ? group.h3s : group.h3s.slice(0, H3_LIMIT)

                return (
                  <React.Fragment key={group.h2.id}>
                    {/* H2 */}
                    {renderHeadingLink(group.h2, 'pl-4')}

                    {/* H3s */}
                    {visibleH3s.map((h3) => renderHeadingLink(h3, 'pl-8'))}

                    {/* Expand button */}
                    {hasMoreThanLimit && (
                      <li className="pl-8">
                        <button
                          onClick={() => toggleSection(group.h2.id)}
                          className="text-xs text-primary hover:underline px-2 py-1"
                        >
                          {isGroupExpanded
                            ? 'Ver menos'
                            : `Ver ${group.h3s.length - H3_LIMIT} más`}
                        </button>
                      </li>
                    )}
                  </React.Fragment>
                )
              })}
            </ul>
          </nav>
        </motion.div>
      </div>
    )
  }

  // Desktop variant: sticky sidebar
  return (
    <nav
      aria-label="Tabla de contenido"
      className="border p-5 rounded-lg bg-card border-border shadow-sm"
    >
      <p className="text-sm font-semibold mb-4 text-foreground flex items-center gap-2">
        <span className="w-1 h-4 bg-primary rounded"></span>
        Contenido
      </p>
      <ul className="space-y-1 text-sm relative">
        {/* Active indicator line */}
        {activeId && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute left-0 w-0.5 bg-primary rounded-full"
            initial={false}
            animate={{
              top: `${headings.findIndex((h) => h.id === activeId) * 36}px`,
              height: 32,
            }}
            transition={{
              type: shouldReduceMotion ? 'tween' : 'spring',
              stiffness: 300,
              damping: 30,
            }}
          />
        )}

        {groupedHeadings.map((group) => {
          const isGroupExpanded = expandedSections.has(group.h2.id)
          const hasMoreThanLimit = group.h3s.length > H3_LIMIT
          const visibleH3s = isGroupExpanded ? group.h3s : group.h3s.slice(0, H3_LIMIT)

          return (
            <React.Fragment key={group.h2.id}>
              {/* H2 */}
              {renderHeadingLink(group.h2, 'pl-3')}

              {/* H3s */}
              {visibleH3s.map((h3) => renderHeadingLink(h3, 'pl-6'))}

              {/* Expand button */}
              {hasMoreThanLimit && (
                <li className="pl-6">
                  <button
                    onClick={() => toggleSection(group.h2.id)}
                    className="text-xs text-primary hover:underline px-2 py-1 transition-colors"
                  >
                    {isGroupExpanded ? 'Ver menos' : `Ver ${group.h3s.length - H3_LIMIT} más`}
                  </button>
                </li>
              )}
            </React.Fragment>
          )
        })}
      </ul>
    </nav>
  )
}

