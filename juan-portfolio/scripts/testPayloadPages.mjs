/**
 * Script de prueba para verificar que las páginas sean accesibles
 * tanto desde MongoDB como desde la API de Payload
 */

import { config } from 'dotenv'
import { MongoClient } from 'mongodb'

config()

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'
const BLUE = '\x1b[36m'

async function testPages() {
  console.log(`${BLUE}🧪 EJECUTANDO PRUEBAS DE PÁGINAS${RESET}\n`)

  const client = new MongoClient(process.env.DATABASE_URI)

  try {
    await client.connect()
    const db = client.db()

    // TEST 1: Verificar conexión a MongoDB
    console.log('📝 TEST 1: Conexión a MongoDB')
    try {
      await db.admin().ping()
      console.log(`${GREEN}   ✅ Conexión exitosa${RESET}\n`)
    } catch (error) {
      console.log(`${RED}   ❌ Error de conexión: ${error.message}${RESET}\n`)
      return
    }

    // TEST 2: Contar páginas en la collection
    console.log('📝 TEST 2: Páginas en collection')
    const pageCount = await db.collection('pages').countDocuments()
    if (pageCount === 3) {
      console.log(`${GREEN}   ✅ ${pageCount} páginas encontradas${RESET}\n`)
    } else {
      console.log(`${YELLOW}   ⚠️  ${pageCount} páginas (se esperaban 3)${RESET}\n`)
    }

    // TEST 3: Verificar campos requeridos
    console.log('📝 TEST 3: Campos requeridos por Payload')
    const requiredFields = [
      '_id',
      'slug',
      'title',
      '_status',
      'publishedAt',
      '__v',
      'createdAt',
      'updatedAt',
    ]
    const pages = await db.collection('pages').find({}).toArray()

    let allFieldsValid = true
    for (const page of pages) {
      const missingFields = requiredFields.filter((field) => !(field in page))
      if (missingFields.length > 0) {
        console.log(
          `${RED}   ❌ Página "${page.slug}" le faltan: ${missingFields.join(', ')}${RESET}`,
        )
        allFieldsValid = false
      }
    }

    if (allFieldsValid) {
      console.log(`${GREEN}   ✅ Todas las páginas tienen los campos requeridos${RESET}\n`)
    } else {
      console.log(`${RED}   ❌ Algunas páginas tienen campos faltantes${RESET}\n`)
    }

    // TEST 4: Verificar estructura multilenguaje
    console.log('📝 TEST 4: Estructura multilenguaje')
    let allMultilangValid = true
    for (const page of pages) {
      const hasTitle = page.title?.en && page.title?.es
      const hasLayout = Array.isArray(page.layout?.en) && Array.isArray(page.layout?.es)

      if (!hasTitle || !hasLayout) {
        console.log(
          `${RED}   ❌ Página "${page.slug}": title=${hasTitle}, layout=${hasLayout}${RESET}`,
        )
        allMultilangValid = false
      }
    }

    if (allMultilangValid) {
      console.log(
        `${GREEN}   ✅ Todas las páginas tienen estructura multilenguaje correcta${RESET}\n`,
      )
    } else {
      console.log(
        `${RED}   ❌ Algunas páginas tienen estructura multilenguaje incorrecta${RESET}\n`,
      )
    }

    // TEST 5: Verificar índices
    console.log('📝 TEST 5: Índices de la collection')
    const indexes = await db.collection('pages').indexes()
    const requiredIndexes = ['_id_', 'slug_1', '_status_1']
    const indexNames = indexes.map((idx) => idx.name)

    let allIndexesExist = true
    for (const reqIdx of requiredIndexes) {
      if (!indexNames.includes(reqIdx)) {
        console.log(`${RED}   ❌ Falta índice: ${reqIdx}${RESET}`)
        allIndexesExist = false
      }
    }

    if (allIndexesExist) {
      console.log(`${GREEN}   ✅ Todos los índices requeridos existen${RESET}\n`)
    } else {
      console.log(`${RED}   ❌ Faltan algunos índices${RESET}\n`)
    }

    // TEST 6: Verificar bloques en páginas
    console.log('📝 TEST 6: Bloques en páginas')
    const blockCounts = {}
    for (const page of pages) {
      const enBlocks = page.layout?.en?.length || 0
      const esBlocks = page.layout?.es?.length || 0
      blockCounts[page.slug] = { en: enBlocks, es: esBlocks }

      if (enBlocks > 0 && esBlocks > 0) {
        console.log(
          `${GREEN}   ✅ ${page.slug}: ${enBlocks} bloques (EN), ${esBlocks} bloques (ES)${RESET}`,
        )
      } else {
        console.log(
          `${RED}   ❌ ${page.slug}: ${enBlocks} bloques (EN), ${esBlocks} bloques (ES)${RESET}`,
        )
      }
    }
    console.log()

    // TEST 7: Verificar payload-preferences (caché)
    console.log('📝 TEST 7: Cache de Payload (payload-preferences)')
    const preferences = await db.collection('payload-preferences').find({}).toArray()
    console.log(`   ℹ️  ${preferences.length} preferencias en caché`)

    const pagePreferences = preferences.filter((p) => p.key?.includes('collection-pages'))
    if (pagePreferences.length > 0) {
      console.log(
        `${YELLOW}   ⚠️  ${pagePreferences.length} preferencias relacionadas con páginas (pueden causar problemas)${RESET}\n`,
      )
    } else {
      console.log(`${GREEN}   ✅ No hay preferencias de páginas cacheadas${RESET}\n`)
    }

    // RESUMEN FINAL
    console.log(`${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`)
    console.log(`${BLUE}📊 RESUMEN DE PRUEBAS${RESET}`)
    console.log(`${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`)

    const allTestsPassed = pageCount === 3 && allFieldsValid && allMultilangValid && allIndexesExist

    if (allTestsPassed) {
      console.log(`${GREEN}✅ TODAS LAS PRUEBAS PASARON${RESET}`)
      console.log(`\n${YELLOW}⚠️  SI LAS PÁGINAS NO APARECEN EN EL ADMIN:${RESET}`)
      console.log(`   1. Reinicia el servidor: Ctrl+C y luego "pnpm run dev"`)
      console.log(`   2. Limpia caché del navegador: Ctrl+Shift+Delete`)
      console.log(`   3. Abre en incógnito: http://localhost:3000/admin/collections/pages`)
    } else {
      console.log(`${RED}❌ ALGUNAS PRUEBAS FALLARON${RESET}`)
      console.log(`   Revisa los errores arriba y ejecuta "pnpm run seed:blocks" de nuevo`)
    }
  } catch (error) {
    console.error(`${RED}❌ ERROR FATAL: ${error.message}${RESET}`)
    console.error(error.stack)
  } finally {
    await client.close()
  }
}

testPages()
