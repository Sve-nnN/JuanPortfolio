'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

interface CategoryHeaderProps {
  title: string
  description?: string
  categorySlug: string
  backgroundImage: string
}

export const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  title,
  description,
  categorySlug,
  backgroundImage,
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <div className="relative min-h-[60vh] flex items-end justify-end pb-12 sm:pb-16 lg:pb-20 mb-8 overflow-hidden">
      {/* Background & Overlay */}
      <div className="absolute inset-0 z-0 select-none">
        <Image
          src={backgroundImage}
          alt="Hero Background"
          fill
          className="object-cover"
          priority
          quality={85}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/60" />
      </div>

      <div className="container z-10 relative flex flex-col items-end text-right text-white">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-4xl w-full flex flex-col items-end gap-6"
        >
          {/* Breadcrumb */}
          <motion.nav
            variants={itemVariants}
            aria-label="Breadcrumb"
            className="flex flex-wrap justify-end gap-2 items-center mb-0 text-sm font-medium uppercase tracking-wide text-white/80"
          >
            <Link className="hover:text-white transition-colors" href="/">
              Inicio
            </Link>
            <span className="text-white/40">/</span>
            <Link className="hover:text-white transition-colors" href="/blog">
              Blog
            </Link>
            <span className="text-white/40">/</span>
            <span className="text-primary-foreground bg-primary/20 px-2 py-0.5 rounded text-xs backdrop-blur-md border border-primary/20">
              {title}
            </span>
          </motion.nav>

          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white drop-shadow-sm leading-tight"
          >
            {title}
          </motion.h1>

          {description && (
            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-gray-200 leading-relaxed max-w-2xl drop-shadow-sm"
            >
              {description}
            </motion.p>
          )}
        </motion.div>
      </div>
    </div>
  )
}
