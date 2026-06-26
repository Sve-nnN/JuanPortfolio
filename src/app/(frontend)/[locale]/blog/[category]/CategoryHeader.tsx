'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useLocale } from '@/providers/Locale'

interface CategoryHeaderProps {
  title: string
  description?: string
  _categorySlug: string
  backgroundImage: string
}

export const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  title,
  description,
  _categorySlug,
  backgroundImage,
}) => {
  const { locale } = useLocale()
  const localePrefix = locale === 'es' ? '' : '/en'

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
    <section className="relative min-h-[60vh] flex items-end justify-end pt-32 pb-12 sm:pb-16 lg:pb-20 overflow-hidden">
      {/* Background & Overlay */}
      <div className="absolute inset-0 z-0 select-none">
        <Image
          src={backgroundImage}
          alt="Hero Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/60" />
      </div>

      <div className="container z-10 relative flex flex-col items-end text-white">
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
            <Link className="hover:text-white transition-colors" href={localePrefix || '/'}>
              {locale === 'es' ? 'Inicio' : 'Home'}
            </Link>
            <span className="text-white/40">/</span>
            <Link className="hover:text-white transition-colors" href={`${localePrefix}/blog`}>
              Blog
            </Link>
            <span className="text-white/40">/</span>
            <span className="text-primary-foreground bg-primary/20 px-2 py-0.5 rounded text-xs backdrop-blur-md border border-primary/20">
              {title}
            </span>
          </motion.nav>

          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white drop-shadow-2xl leading-[0.9] tracking-tighter text-right"
          >
            {title}
          </motion.h1>

          {description && (
            <motion.p
              variants={itemVariants}
              className="text-xl md:text-3xl text-gray-100 leading-tight max-w-3xl drop-shadow-lg font-medium text-right"
            >
              {description}
            </motion.p>
          )}
        </motion.div>
      </div>
    </section>
  )
}
