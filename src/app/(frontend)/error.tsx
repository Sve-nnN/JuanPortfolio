'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { RefreshCcw, Home, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[80vh] flex items-center justify-center container py-32">
      <div className="max-w-2xl w-full text-center space-y-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative inline-block"
        >
          <div className="absolute inset-0 bg-red-500/20 blur-[80px] rounded-full" />
          <div className="relative bg-background border border-border/50 p-8 rounded-3xl shadow-2xl flex items-center justify-center">
            <AlertCircle size={80} className="text-red-500" strokeWidth={1.5} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          className="space-y-6"
        >
          <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tighter text-foreground">
            Vaya, algo salió <span className="text-red-500">mal</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-lg mx-auto">
            Ha ocurrido un error inesperado en el servidor. Estamos trabajando para solucionarlo lo antes posible.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button
            variant="default"
            size="lg"
            onClick={() => reset()}
            className="rounded-full px-10 py-7 text-lg font-bold transition-all hover:scale-105 active:scale-95 group"
          >
            <RefreshCcw size={20} className="mr-2 group-hover:rotate-180 transition-transform duration-500" />
            Reintentar
          </Button>

          <Button
            variant="outline"
            size="lg"
            asChild
            className="rounded-full px-10 py-7 text-lg font-bold border-border/50 bg-background/50 backdrop-blur-sm transition-all hover:scale-105 active:scale-95 group"
          >
            <Link href="/">
              <Home size={20} className="mr-2" />
              Ir al Inicio
            </Link>
          </Button>
        </motion.div>

        {error.digest && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            className="text-[10px] font-mono tracking-widest uppercase mt-8"
          >
            Error ID: {error.digest}
          </motion.p>
        )}
      </div>
    </div>
  )
}
