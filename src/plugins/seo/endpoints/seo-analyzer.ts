/* eslint-disable @typescript-eslint/no-explicit-any */
import { analyzeSEO } from '../utils/seoAnalyzer'

export const seoAnalyzer: any = async (req: any, res: any) => {
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
