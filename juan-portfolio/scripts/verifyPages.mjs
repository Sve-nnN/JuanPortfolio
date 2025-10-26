#!/usr/bin/env node
/**
 * Script de verificación rápida del estado de las páginas en Payload
 * Ejecutar con: pnpm run verify:pages
 */

import { config } from 'dotenv'
import { MongoClient } from 'mongodb'

config()

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'
const BLUE = '\x1b[36m'
const BOLD = '\x1b[1m'

async function verifyPages() {
  console.log(`${BOLD}${BLUE}╔════════════════════════════════════════╗${RESET}`)
  console.log(`${BOLD}${BLUE}║  VERIFICACIÓN DE PÁGINAS PAYLOAD CMS  ║${RESET}`)
  console.log(`${BOLD}${BLUE}╚════════════════════════════════════════╝${RESET}\n`)

  if (!process.env.DATABASE_URI) {
    console.log(`${RED}❌ ERROR: No se encontró DATABASE_URI en las variables de entorno${RESET}`)
    process.exit(1)
  }

  const client = new MongoClient(process.env.DATABASE_URI)

  try {
    await client.connect()
    const db = client.db()

    // Verificar conexión
    console.log(`${BLUE}🔌 Verificando conexión a MongoDB...${RESET}`)
    await db.admin().ping()
    console.log(`${GREEN}   ✅ Conectado exitosamente${RESET}\n`)

    // Contar páginas
    const pageCount = await db.collection('pages').countDocuments()
    console.log(`${BLUE}📄 Páginas en la base de datos: ${BOLD}${pageCount}${RESET}`)

    if (pageCount !== 3) {
      console.log(`${YELLOW}   ⚠️  Se esperaban 3 páginas (home, blog, case-studies)${RESET}\n`)
    } else {
      console.log(`${GREEN}   ✅ Cantidad correcta de páginas${RESET}\n`)
    }

    // Detalles de cada página
    const pages = await db.collection('pages').find({}).sort({ slug: 1 }).toArray()

    console.log(`${BLUE}${BOLD}📋 DETALLES DE PÁGINAS:${RESET}\n`)

    let allValid = true

    for (const page of pages) {
      const hasTitle = page.title?.en && page.title?.es
      const hasLayout = Array.isArray(page.layout?.en) && Array.isArray(page.layout?.es)
      const isPublished = page._status === 'published'
      const hasPublishedAt = !!page.publishedAt
      const hasVersion = page.__v !== undefined

      const isValid = hasTitle && hasLayout && isPublished && hasPublishedAt && hasVersion

      if (!isValid) allValid = false

      const statusIcon = isValid ? `${GREEN}✅${RESET}` : `${RED}❌${RESET}`

      console.log(`${statusIcon} ${BOLD}${page.slug}${RESET}`)
      console.log(`   ID: ${page._id}`)
      console.log(`   Título EN: ${page.title?.en || `${RED}FALTA${RESET}`}`)
      console.log(`   Título ES: ${page.title?.es || `${RED}FALTA${RESET}`}`)
      console.log(`   Bloques EN: ${page.layout?.en?.length || 0}`)
      console.log(`   Bloques ES: ${page.layout?.es?.length || 0}`)
      console.log(
        `   Estado: ${page._status === 'published' ? `${GREEN}published${RESET}` : `${YELLOW}${page._status}${RESET}`}`,
      )
      console.log(
        `   Published At: ${page.publishedAt ? `${GREEN}✅${RESET}` : `${RED}FALTA${RESET}`}`,
      )
      console.log(
        `   Version (__v): ${page.__v !== undefined ? `${GREEN}${page.__v}${RESET}` : `${RED}FALTA${RESET}`}`,
      )

      // Mostrar tipos de bloques
      if (page.layout?.en && page.layout.en.length > 0) {
        const blockTypes = page.layout.en.map((b) => b.blockType).join(', ')
        console.log(`   Tipos de bloques: ${blockTypes}`)
      }

      console.log('')
    }

    // Verificar caché
    console.log(`${BLUE}${BOLD}🗄️  CACHÉ DE PAYLOAD:${RESET}`)
    const cacheCount = await db.collection('payload-preferences').countDocuments()

    if (cacheCount === 0) {
      console.log(`${GREEN}   ✅ Caché limpio (0 preferencias)${RESET}\n`)
    } else if (cacheCount <= 5) {
      console.log(`${GREEN}   ✅ Caché normal (${cacheCount} preferencias)${RESET}\n`)
    } else {
      console.log(
        `${YELLOW}   ⚠️  ${cacheCount} preferencias en caché (considera limpiarlo si hay problemas)${RESET}\n`,
      )
    }

    // Verificar índices
    console.log(`${BLUE}${BOLD}📊 ÍNDICES DE BASE DE DATOS:${RESET}`)
    const indexes = await db.collection('pages').indexes()
    const requiredIndexes = ['_id_', 'slug_1', '_status_1']

    for (const reqIdx of requiredIndexes) {
      const exists = indexes.some((idx) => idx.name === reqIdx)
      if (exists) {
        console.log(`${GREEN}   ✅ ${reqIdx}${RESET}`)
      } else {
        console.log(`${RED}   ❌ ${reqIdx} (FALTA)${RESET}`)
        allValid = false
      }
    }

    console.log('')

    // RESUMEN FINAL
    console.log(`${BLUE}${BOLD}═══════════════════════════════════════${RESET}`)

    if (allValid && pageCount === 3) {
      console.log(`${GREEN}${BOLD}🎉 ¡TODO CORRECTO!${RESET}`)
      console.log(`${GREEN}   Todas las páginas están configuradas correctamente${RESET}`)
      console.log(`\n${BLUE}🌐 URLs del Admin:${RESET}`)
      console.log(`   http://localhost:3000/admin/collections/pages`)
      console.log(`   http://localhost:3002/admin/collections/pages (si 3000 está ocupado)`)
    } else {
      console.log(`${RED}${BOLD}⚠️  HAY PROBLEMAS${RESET}`)
      console.log(`${YELLOW}   Ejecuta "pnpm run seed:blocks" para corregir${RESET}`)
    }

    console.log(`${BLUE}${BOLD}═══════════════════════════════════════${RESET}`)
  } catch (error) {
    console.error(`${RED}❌ ERROR: ${error.message}${RESET}`)
    process.exit(1)
  } finally {
    await client.close()
  }
}

verifyPages()
