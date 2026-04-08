const fs = require('fs')
const content = fs.readFileSync('content/keywords.md', 'utf8')
const lines = content.split('\n')
const tableStartIndex = lines.findIndex((line) => line.trim().startsWith('|'))

const splitByPipe = (text) => {
  const trimmed = text.trim().replace(/^\||\|$/g, '')
  return trimmed.split(/(?<!\\)\|/).map((cell) => cell.trim().replace(/\\\|/g, '|'))
}

const headers = splitByPipe(lines[tableStartIndex])
console.log('--- HEADERS ---')
console.log(headers.map((h, i) => i + ': ' + h))

const rowCells = splitByPipe(lines[tableStartIndex + 2])
console.log('--- ROW ---')
console.log(rowCells.map((h, i) => i + ': ' + h))
