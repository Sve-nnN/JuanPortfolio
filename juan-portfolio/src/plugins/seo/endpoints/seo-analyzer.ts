import type { PayloadHandler } from 'payload'
import { analyzeSEO } from '../utils/seoAnalyzer'

export const seoAnalyzer: PayloadHandler = async (req, res) => {
  try {
    const { title, content, meta, slug } = req.body

    if (!title && !content) {
      return res.status(400).json({
        error: 'Title or content is required',
      })
    }

    const analysis = await analyzeSEO({
      title,
      content,
      meta,
      slug,
    })

    res.status(200).json(analysis)
  } catch (error) {
    req.payload.logger.error(`SEO analyzer error: ${error}`)
    res.status(500).json({
      error: 'Error analyzing SEO',
    })
  }
}
