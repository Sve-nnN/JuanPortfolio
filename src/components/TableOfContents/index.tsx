'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Heading } from '@/utilities/extractHeadings'
import { cn } from '@/utilities/ui'
import { trackEvent } from '@/utilities/analytics'

interface TableOfContentsProps {
  headings: Heading[]
  variant?: 'desktop' | 'mobile'
}

interface GroupedHeading {
  h2: Heading
  children: Heading[]
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  headings,
  variant = 'desktop',
}) => {
  const [activeId, setActiveId] = useState<string>('')
  const [_isExpanded, setIsExpanded] = useState(false)
  
  // Group headings by H2 parent
  const groupedHeadings = useMemo(() => {
    const groups: GroupedHeading[] = []
    let currentGroup: GroupedHeading | null = null

    headings.forEach((h) => {
      if (h.level === 2) {
        if (currentGroup) groups.push(currentGroup)
        currentGroup = { h2: h, children: [] }
      } else if (currentGroup && (h.level === 3 || h.level === 4)) {
        currentGroup.children.push(h)
      }
    })
    if (currentGroup) groups.push(currentGroup)
    return groups
  }, [headings])

  // Find which H2 is currently active (including if its child is active)
  const activeH2Id = useMemo(() => {
    const activeGroup = groupedHeadings.find(group => 
      group.h2.id === activeId || group.children.some(c => c.id === activeId)
    )
    return activeGroup?.h2.id || ''
  }, [groupedHeadings, activeId])

  // Scroll spy: track which heading is currently visible using IntersectionObserver (avoids forced reflows)
  useEffect(() => {
    if (!headings || headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Find all intersecting entries
        const intersecting = entries.filter((e) => e.isIntersecting)
        if (intersecting.length > 0) {
          // Sort by their position in the document (top to bottom)
          // Actually we want the one that is closest to the top offset
          const topVisible = intersecting.reduce((prev, curr) => {
            return prev.boundingClientRect.top < curr.boundingClientRect.top ? prev : curr
          })
          setActiveId(topVisible.target.id)
        }
      },
      {
        rootMargin: '-100px 0px -70% 0px',
        threshold: [0, 1],
      }
    )

    headings.forEach((h) => {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headings])

  // Handle click on TOC link with smooth scroll
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault()
      const target = document.getElementById(id)
      if (target) {
        const offset = 120
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - offset
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        })
        
        trackEvent('toc_navigation', { 
          heading_id: id,
          variant 
        })

        setActiveId(id)
        window.history.pushState(null, '', `#${id}`)
        if (variant === 'mobile') setIsExpanded(false)
      }
    },
    [variant],
  )

  if (!headings || headings.length === 0) return null

  // Render a single heading link
  const renderHeadingLink = (h: Heading, isChild: boolean = false) => {
    const isActive = activeId === h.id
    return (
      <li key={h.id} className={cn(
        'relative transition-all duration-300',
        isChild && h.level === 3 ? 'ml-4' : '',
        isChild && h.level === 4 ? 'ml-8' : ''
      )}>
        <a
          href={`#${h.id}`}
          onClick={(e) => handleClick(e, h.id)}
          className={cn(
            'block py-2 text-base transition-all duration-300 relative z-10',
            isActive 
              ? 'text-primary font-bold' 
              : 'text-muted-foreground font-medium hover:text-foreground'
          )}
        >
          {h.text}
        </a>
        {isActive && (
          <motion.div
            layoutId="active-pill"
            className="absolute inset-y-1 -left-4 right-0 bg-primary/5 rounded-r-xl border-l-4 border-primary z-0"
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
        )}
      </li>
    )
  }

  // Desktop variant: Sticky Card with Accordion Logic
  return (
    <nav
      aria-label="Tabla de contenido"
      className={cn(
        "card-elevated p-8 bg-card/80 backdrop-blur-xl border-t-4 border-t-primary/10",
        variant === 'mobile' && "hidden lg:block" // Hide mobile handled separately
      )}
    >
      <p className="text-xs font-bold mb-8 text-foreground uppercase tracking-[0.2em] flex items-center gap-3">
        <span className="w-1.5 h-5 bg-primary rounded-full"></span>
        Contenido
      </p>
      <ul className="space-y-1 relative">
        {groupedHeadings.map((group) => (
          <React.Fragment key={group.h2.id}>
            {renderHeadingLink(group.h2)}
            
            <AnimatePresence>
              {activeH2Id === group.h2.id && group.children.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <ul className="pt-1 pb-2 border-l border-border/50 ml-1">
                    {group.children.map(child => renderHeadingLink(child, true))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </React.Fragment>
        ))}
      </ul>
    </nav>
  )
}

