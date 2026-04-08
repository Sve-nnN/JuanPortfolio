const fs = require('fs')

const content = fs.readFileSync('content/keywords.md', 'utf8')
const lines = content.split('\n')

// The headers in the git version:
// | Keyword | Target URL | Language | Country | Volume | Difficulty | Intent | Status | Last Updated | ...
// BUT the rows were originally from an older version:
// | Keyword | Target URL | Volume | Difficulty | Intent | Status | Last Updated | ...
// OR they were already padded? Let's check a row.

const outLines = lines.map((line, i) => {
  if (line.includes('| Difficulty |') || line.includes(' Difficulty ')) {
    if (!line.includes('| Trend |')) {
      return line.replace(' Difficulty ', ' Difficulty | Trend ')
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

  if (line.trim().startsWith('|') && !line.includes('Difficulty') && !line.includes('---')) {
    let parts = line.split(/(?<!\\)\|/)
    if (parts.length > 5) {
      // Look for the date field 'YYYY-MM-DD'
      const dateRegex = /\d{4}-\d{2}-\d{2}/
      const dateIdx = parts.findIndex((p) => dateRegex.test(p))

      if (dateIdx > 0) {
        // We know Language and Country were inserted after Target URL.
        // Target URL is at index 2 (parts[2]).
        // If the date element is at index 7, it means the row has:
        // 1:Kw, 2:URL, 3:(Vol?), 4:(Diff?), 5:Intent, 6:Status, 7:Date
        // If the date is at 7, then 2 columns are missing (Lang, Country).
        // Wait, if it has empty fields, they might be empty strings.
        // Let's check part[3] to part[dateIdx-1].
        // Are Language and Country correctly populated for ANY row?
        // Let's just blindly check the distance from URL(2) to Date.
        // The ideal distance:
        // 1:Kw, 2:URL, 3:Lang, 4:Country, 5:Vol, 6:Diff, 7:Trend, 8:Intent, 9:Status, 10:Date
        // So 10 - 2 = 8 columns between URL and Date (inclusive).
        // Let's just parse the row fields based on what they contain.

        let kw = parts[1]
        let url = parts[2]

        let vol = ' '
        let diff = ' '
        let intent = ' '
        let status = ' '
        let date = parts[dateIdx]

        // Everything between 2 and dateIdx are vol, diff, intent, status etc.
        // But what if it was 1:Kw, 2:URL, 3:Vol, 4:Diff, 5:Intent, 6:Status, 7:Date?
        // We can just extract them backwards!
        // Immediately before date is Status.
        status = parts[dateIdx - 1]
        // Immediately before Status is Intent.
        intent = parts[dateIdx - 2]
        // Before Intent is Difficulty
        diff = parts[dateIdx - 3]
        // Before Difficulty is Volume
        vol = parts[dateIdx - 4]

        // Reconstruct the row properly:
        let newParts = [...parts]
        // Replace everything between 2 and dateIdx with the correct padded structure!
        let newMid = [
          ' ', // Lang
          ' ', // Country
          vol,
          diff,
          ' ', // Trend
          intent,
          status,
          date,
        ]

        newParts.splice(3, dateIdx - 2, ...newMid)
        return newParts.join('|')
      }
    }
  }
  return line
})

fs.writeFileSync('content/keywords.md', outLines.join('\n'))
