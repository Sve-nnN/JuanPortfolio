import fs from 'fs'
import path from 'path'

/**
 * Script para buscar una palabra clave en content/keywords.md
 * Uso: npx tsx src/scripts/search-keyword.ts "tu palabra clave"
 */

const KEYWORDS_PATH = path.join(process.cwd(), 'content/keywords.md')

function searchKeyword() {
  const query = process.argv[2]

  if (!query) {
    console.error('Por favor, proporciona una palabra clave como argumento.')
    console.log('Uso: npx tsx src/scripts/search-keyword.ts "technical seo"')
    process.exit(1)
  }

  if (!fs.existsSync(KEYWORDS_PATH)) {
    console.error(`No se encontró el archivo: ${KEYWORDS_PATH}`)
    process.exit(1)
  }

  const content = fs.readFileSync(KEYWORDS_PATH, 'utf-8')
  const lines = content.split(/\r?\n/)

  // Encontrar el inicio de la tabla
  const tableStartIndex = lines.findIndex((line) => line.trim().startsWith('|'))
  if (tableStartIndex === -1) {
    console.error('No se encontró una tabla en content/keywords.md')
    process.exit(1)
  }

  const headerLine = lines[tableStartIndex]
  const dataLines = lines.slice(tableStartIndex + 2)

  const splitByPipe = (text: string) => {
    const trimmed = text.trim().replace(/^\||\|$/g, '')
    const parts = trimmed.split(/(?<!\\)\|/)
    return parts.map(p => p.trim().replace(/\\\|/g, '|'))
  }

  const headers = splitByPipe(headerLine)

  const result = dataLines
    .map((line) => {
      if (!line.trim().startsWith('|')) return null
      
      const cells = splitByPipe(line)
      if (cells.length === 0) return null

      // Mapear celdas a headers de forma dinámica
      const rowData: Record<string, string> = {}
      headers.forEach((header, index) => {
        rowData[header] = cells[index] || '(vacío)'
      })

      return rowData
    })
    .filter(Boolean)
    .find((row) => row && row[headers[0]]?.toLowerCase() === query.toLowerCase())

  if (result) {
    console.log(`\nInformación encontrada para: "${query}"\n`)
    headers.forEach((header) => {
      console.log(`${header.padEnd(25)}: ${result[header]}`)
    })
  } else {
    console.log(`No se encontró la palabra clave: "${query}"`)
    
    // Sugerencias
    const suggestions = dataLines
      .filter(l => l.trim().startsWith('|'))
      .map(l => splitByPipe(l)[0])
      .filter(k => k && k.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5)

    if (suggestions.length > 0) {
      console.log('\nSugerencias similares:')
      suggestions.forEach(s => console.log(`- ${s}`))
    }
  }
}

searchKeyword()
