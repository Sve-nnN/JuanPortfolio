const fs = require('fs')
const content = fs.readFileSync('content/keywords.md', 'utf8')
const lines = content.split('\n')

const outLines = lines.map((line) => {
  // If it is the main header line with " Difficulty "
  if (line.includes('| Difficulty |') || line.includes(' Difficulty ')) {
    return line.replace(' Difficulty ', ' Difficulty | Trend ')
  }
  // If it is the separator line
  if (line.includes('| :------') && line.includes('---')) {
    return line.replace(
      ':--------- | :--------- | :----------------------',
      ':--------- | :---- | :--------- | :----------------------',
    )
  }
  // If it is a data line starting with "|"
  if (line.startsWith('|') && !line.includes('Difficulty') && !line.includes('---')) {
    const parts = line.split('|')
    // For standard data rows (not header or separator)
    if (parts.length > 7) {
      // 0 is before the first |
      // 1 Keyword, 2 Target URL, 3 Language, 4 Country, 5 Volume, 6 Difficulty, 7 Intent
      // We want to insert ' Trend ' at index 7, which will shift Intent to 8
      parts.splice(7, 0, ' ')
      return parts.join('|')
    }
  }
  return line
})

fs.writeFileSync('content/keywords.md', outLines.join('\n'))
