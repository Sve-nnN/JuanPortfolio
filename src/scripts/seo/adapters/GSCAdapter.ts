import { google, searchconsole_v1 } from 'googleapis'

// Derive the JWT type from the same `googleapis` source as `new google.auth.JWT`
// below. Importing JWT from the standalone `google-auth-library` breaks the
// build when the package manager (e.g. Vercel's `npm install --legacy-peer-deps`
// vs CI's pnpm) hoists a second, type-incompatible copy of google-auth-library
// under googleapis-common. SEO audit jun-2026 (Vercel deploy fix).
type GoogleJWT = InstanceType<typeof google.auth.JWT>

export interface GSCPerformanceRow {
  date: string
  page: string
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  country: string
  device: string
}

export class GSCAdapter {
  private auth: GoogleJWT
  private sc: searchconsole_v1.Searchconsole
  private siteUrl: string

  constructor() {
    const clientEmail = process.env.GSC_CLIENT_EMAIL
    const privateKey = process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, '\n')
    this.siteUrl = process.env.GSC_PROPERTY_URL || ''

    if (!clientEmail || !privateKey || !this.siteUrl) {
      throw new Error('GSC_CLIENT_EMAIL, GSC_PRIVATE_KEY, and GSC_PROPERTY_URL must be set in .env')
    }

    this.auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    })

    this.sc = google.searchconsole({ version: 'v1', auth: this.auth })
  }

  /**
   * Inspects a URL to check its indexing status
   */
  public async inspectUrl(url: string) {
    try {
      const response = await this.sc.urlInspection.index.inspect({
        requestBody: {
          inspectionUrl: url,
          siteUrl: this.siteUrl,
          languageCode: 'es', // Optional
        },
      })
      return response.data.inspectionResult
    } catch (error) {
      console.error(`Error inspecting URL ${url}:`, error)
      return null
    }
  }

  /**
   * Fetches performance data from GSC
   */
  public async fetchPerformance(
    startDate: string,
    endDate: string,
    dimensions: string[] = ['date', 'page', 'query', 'country', 'device'],
    rowLimit: number = 25000,
  ): Promise<GSCPerformanceRow[]> {
    try {
      const response = await this.sc.searchanalytics.query({
        siteUrl: this.siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions,
          rowLimit,
        },
      })

      if (!response.data.rows) return []

      return response.data.rows.map((row) => ({
        date: row.keys?.[dimensions.indexOf('date')] || '',
        page: row.keys?.[dimensions.indexOf('page')] || '',
        query: row.keys?.[dimensions.indexOf('query')] || '',
        country: row.keys?.[dimensions.indexOf('country')] || '',
        device: row.keys?.[dimensions.indexOf('device')] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      }))
    } catch (error) {
      console.error('Error fetching GSC data:', error)
      throw error
    }
  }

  /**
   * Lists sitemaps for the property
   */
  public async listSitemaps() {
    try {
      const response = await this.sc.sitemaps.list({ siteUrl: this.siteUrl })
      return response.data.sitemap || []
    } catch (error) {
      console.error('Error listing sitemaps:', error)
      throw error
    }
  }
}
