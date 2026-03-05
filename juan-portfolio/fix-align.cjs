const fs = require('fs')

const content = fs.readFileSync('content/keywords.md', 'utf8')
const lines = content.split('\n')

// 0: Keyword
// 1: Target URL
// 2: Language
// 3: Country
// 4: Volume
// 5: Difficulty
// 6: Trend
// 7: Intent
// 8: Status
// 9: Last Updated

const diffIdx = lines.findIndex((l) => l.startsWith('| Keyword |') || l.includes(' Keyword '))

const outLines = lines.map((line, i) => {
  if (i === diffIdx) {
    if (!line.includes('| Trend |')) {
      return line.replace(' Difficulty |', ' Difficulty | Trend |')
    }
  }
  if (line.includes('| :------') && line.includes('---')) {
    if (!line.includes(':---- | :---------')) {
      return line.replace(
        ':--------- | :--------- | :----------------------',
        ':--------- | :---- | :--------- | :----------------------',
      )
    }
  }

  if (
    line.startsWith('|') &&
    !line.includes('Difficulty') &&
    !line.includes('---') &&
    line.trim().length > 10
  ) {
    let parts = line.split(/(?<!\\)\|/)

    // There are 2 ways: if parts has fewer elements than headers
    // The previous format had 'Last Updated' as the 6th item (excluding start '|').
    // Let's see: if parts.length === 20 (original without language, country, volume, difficulty, trend)
    // Actually the date is always YYYY-MM-DD. Let's find its current index.
    const dateIdx = parts.findIndex((p) => /\d{4}-\d{2}-\d{2}/.test(p))

    if (dateIdx > 0 && dateIdx < 10) {
      // In the new headers, Last Updated is index 9.
      // E.g. 0:"", 1:"kw", 2:"url", 3:"lang", 4:"country", 5:"vol", 6:"diff", 7:"trend", 8:"intent", 9:"status", 10:"date"
      // Wait, in my header list above:
      // 0: Keyword (in parts, parts[1])
      // 1: Target URL (parts[2])
      // 2: Language (parts[3])
      // 3: Country (parts[4])
      // 4: Volume (parts[5])
      // 5: Difficulty (parts[6])
      // 6: Trend (parts[7])
      // 7: Intent (parts[8])
      // 8: Status (parts[9])
      // 9: Last Updated (parts[10])

      const targetDateIdx = 10
      if (dateIdx < targetDateIdx) {
        // We need to insert (targetDateIdx - dateIdx) empty columns before the date!
        // But wait! Are the missing columns BEFORE intent?
        // E.g. date is at 7 (parts[7]). Target is 10. We need to insert 3 columns.
        // Let's just insert them at index 3 (after URL).
        const diff = targetDateIdx - dateIdx
        for (let j = 0; j < diff; j++) {
          parts.splice(3, 0, '  ')
        }
      }
    }
    return parts.join('|')
  }
  return line
})

fs.writeFileSync('content/keywords.md', outLines.join('\n'))
console.log('Migration complete. Run cat content/keywords.md to verify.')
