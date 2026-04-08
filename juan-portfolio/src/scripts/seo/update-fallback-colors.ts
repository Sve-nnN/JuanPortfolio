import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { FALLBACK_IMAGES } from '../../constants/fallbackImages'

async function updateFallbackColors() {
  console.log('🎨 Extracting colors from fallback images...')
  const colorMap: Record<string, string> = {}

  for (const imageUrl of FALLBACK_IMAGES) {
    try {
      // Since these are remote URLs, we fetch them
      const response = await fetch(imageUrl)
      const buffer = await response.arrayBuffer()
      
      const { channels } = await sharp(Buffer.from(buffer)).stats()
      const [r, g, b] = channels.map((c) => Math.round(c.mean))
      const color = `rgb(${r}, ${g}, ${b})`
      
      colorMap[imageUrl] = color
      console.log(`✅ ${imageUrl} -> ${color}`)
    } catch (error) {
      console.error(`❌ Error processing ${imageUrl}:`, error)
    }
  }

  const filePath = path.resolve(process.cwd(), 'src/constants/fallbackImages.ts')
  let content = fs.readFileSync(filePath, 'utf8')

  // Add the color map to the file
  const colorMapString = `

export const FALLBACK_COLORS: Record<string, string> = ${JSON.stringify(colorMap, null, 2)};`
  
  if (content.includes('export const FALLBACK_COLORS')) {
    content = content.replace(/export const FALLBACK_COLORS: Record<string, string> = \{[\s\S]*?\};/, colorMapString.trim())
  } else {
    content += colorMapString
  }

  // Update getFallbackBySlug to return both URL and color
  if (!content.includes('getFallbackColorBySlug')) {
    content += `

export const getFallbackColorBySlug = (slug: string = '') => {
  if (!slug) return FALLBACK_COLORS[FALLBACK_IMAGES[0]];

  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash % FALLBACK_IMAGES.length);
  const imageUrl = FALLBACK_IMAGES[index];
  return FALLBACK_COLORS[imageUrl] || 'rgb(var(--primary))';
};`
  }

  fs.writeFileSync(filePath, content)
  console.log('✨ Updated src/constants/fallbackImages.ts with color metadata')
}

updateFallbackColors()
