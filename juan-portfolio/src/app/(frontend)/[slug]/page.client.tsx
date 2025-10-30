/**
 * @file Defines the client-side component for dynamic pages.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import React, { useEffect } from 'react'

/**
 * The client-side component for dynamic pages.
 * This component is responsible for setting the header theme.
 * @returns {React.ReactElement} A React fragment.
 */
const PageClient: React.FC = () => {
  /* Force the header to be dark mode while we have an image behind it */
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('light')
  }, [setHeaderTheme])
  return <React.Fragment />
}

export default PageClient