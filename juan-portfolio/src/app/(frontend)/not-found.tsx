/**
 * @file Defines the 404 Not Found page.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import Link from 'next/link'
import React from 'react'

import { Button } from '@/components/ui/button'

/**
 * The 404 Not Found page component.
 * @returns {React.ReactElement} The 404 page component.
 */
export default function NotFound() {
  return (
    <div className="container py-28">
      <div className="prose max-w-none">
        <h1 style={{ marginBottom: 0 }}>404</h1>
        <p className="mb-4">This page could not be found.</p>
      </div>
      <Button asChild variant="default">
        <Link href="/">Go home</Link>
      </Button>
    </div>
  )
}