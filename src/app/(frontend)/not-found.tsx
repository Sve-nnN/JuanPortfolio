import Link from 'next/link'
import React from 'react'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="container py-28 flex flex-col items-center justify-center text-center min-h-[60vh]">
      <div className="prose max-w-none mb-8">
        <h1 style={{ marginBottom: '1rem', fontSize: '6rem', lineHeight: 1 }}>404</h1>
        <h2 className="text-2xl font-semibold mb-4">Página no encontrada</h2>
        <p className="mb-8 text-muted-foreground max-w-md mx-auto">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>
      </div>
      <Button asChild variant="default" size="lg">
        <Link href="/">
          Volver al Inicio
        </Link>
      </Button>
    </div>
  )
}