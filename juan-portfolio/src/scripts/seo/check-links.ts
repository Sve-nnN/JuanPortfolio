import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../../payload.config'
import { LinkChecker } from 'linkinator'

async function checkBrokenLinks() {
  console.log('🔍 Iniciando auditoría técnica de enlaces...')
  const payload = await getPayload({ config })
  const checker = new LinkChecker()
  
  const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

  // Configuración del escáner
  const results = await checker.check({
    path: siteUrl,
    recurse: true,
    concurrency: 10,
    timeout: 5000,
    linksToSkip: [
      'https://www.linkedin.com', // LinkedIn a veces bloquea escaneos automáticos
      'https://twitter.com',
    ]
  })

  const brokenLinks = results.links.filter(l => l.state === 'BROKEN')
  console.log(`✅ Auditoría finalizada. Enlaces rotos detectados: ${brokenLinks.length}`)

  // Limpiar reportes antiguos (opcional, para mantener la base de datos limpia)
  // await payload.delete({ collection: 'broken-links', where: { id: { exists: true } } })

  for (const link of brokenLinks) {
    // Buscar si ya existe este reporte
    const existing = await payload.find({
      collection: 'broken-links',
      where: {
        and: [
          { url: { equals: link.url } },
          { sourcePage: { equals: link.parent } }
        ]
      },
      limit: 1
    })

    const data = {
      url: link.url || 'Desconocida',
      statusCode: link.status || 0,
      statusText: link.statusText || 'Error de conexión',
      sourcePage: link.parent || siteUrl,
      lastChecked: new Date().toISOString(),
    }

    if (existing.totalDocs > 0) {
      await payload.update({
        collection: 'broken-links',
        id: existing.docs[0].id,
        data,
      })
    } else {
      await payload.create({
        collection: 'broken-links',
        data,
      })
    }
  }

  console.log('✨ Reporte de enlaces rotos actualizado en Payload.')
  process.exit(0)
}

checkBrokenLinks().catch(err => {
  console.error('❌ Fallo en la auditoría de enlaces:', err)
  process.exit(1)
})
