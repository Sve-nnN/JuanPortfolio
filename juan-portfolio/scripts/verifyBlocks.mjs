/**
 * Script to verify that all blocks are properly configured
 */

import { readdir, stat } from 'fs/promises'
import { join } from 'path'

const BLOCKS_DIR = './src/blocks'

async function verifyBlocks() {
  console.log('🔍 Verificando bloques...\n')

  try {
    const entries = await readdir(BLOCKS_DIR)
    const blockDirs = []

    // Filter only directories
    for (const entry of entries) {
      const entryPath = join(BLOCKS_DIR, entry)
      const stats = await stat(entryPath)
      if (stats.isDirectory()) {
        blockDirs.push(entry)
      }
    }

    console.log(`📦 Encontrados ${blockDirs.length} bloques:\n`)

    const issues = []
    const validBlocks = []

    for (const blockDir of blockDirs) {
      const blockPath = join(BLOCKS_DIR, blockDir)

      try {
        // Check for required files
        const files = await readdir(blockPath)
        const hasConfig = files.some((f) => f === 'config.ts' || f === 'config.tsx')
        const hasComponent = files.some(
          (f) => f === 'Component.tsx' || f === 'Component.ts' || f === 'index.tsx',
        )

        if (hasConfig && hasComponent) {
          console.log(`✅ ${blockDir}`)
          validBlocks.push(blockDir)
        } else {
          const missing = []
          if (!hasConfig) missing.push('config.ts')
          if (!hasComponent) missing.push('Component.tsx')
          console.log(`⚠️  ${blockDir} - Falta: ${missing.join(', ')}`)
          issues.push({ block: blockDir, missing })
        }
      } catch (error) {
        console.log(`❌ ${blockDir} - Error al leer: ${error.message}`)
        issues.push({ block: blockDir, error: error.message })
      }
    }

    console.log(`\n📊 Resumen:`)
    console.log(`   ✅ Bloques válidos: ${validBlocks.length}`)
    console.log(`   ⚠️  Bloques con problemas: ${issues.length}`)

    if (issues.length > 0) {
      console.log(`\n⚠️  Problemas encontrados:`)
      issues.forEach((issue) => {
        if (issue.missing) {
          console.log(`   - ${issue.block}: Falta ${issue.missing.join(', ')}`)
        } else if (issue.error) {
          console.log(`   - ${issue.block}: ${issue.error}`)
        }
      })
    }

    console.log('\n✨ Bloques nuevos implementados:')
    const newBlocks = [
      'HeroHome',
      'AboutSection',
      'FeaturedWorks',
      'FeaturedClients',
      'FeaturedBlog',
      'ContactFormBlock',
      'SimpleCTA',
      'ListingHero',
      'PostsGrid',
      'CaseStudiesGrid',
      'PostHero',
      'SidebarBanners',
      'TableOfContentsBlock',
      'RelatedPostsBlock',
    ]

    newBlocks.forEach((block) => {
      if (validBlocks.includes(block)) {
        console.log(`   ✅ ${block}`)
      } else {
        console.log(`   ❌ ${block} - NO ENCONTRADO`)
      }
    })

    console.log('\n✅ Verificación completa!\n')
  } catch (error) {
    console.error('❌ Error al verificar bloques:', error)
    process.exit(1)
  }
}

verifyBlocks()
