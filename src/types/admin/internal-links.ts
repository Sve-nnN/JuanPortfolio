/** A single internal-link suggestion safe for JSON transport to the admin UI. */
export interface LinkSuggestion {
  /** Slug of the source post (the one being edited) */
  sourceSlug: string;
  /** Slug of the target post to link to */
  targetSlug: string;
  /** Title of the target post (for display) */
  targetTitle: string;
  /** URL path of the target post (e.g. /tech-seo/big-o) */
  targetUrl: string;
  /** The keyword text that will become the anchor text */
  keyword: string;
  /** The surrounding sentence/phrase showing context */
  context: string;
  /** Line number in the markdown file (1-based) */
  lineNumber: number;
  /** Combined semantic relevance score 0–1 */
  confidence: number;
  /** Absolute file path to the source markdown file */
  filePath: string;
  /** Optional semantic score breakdown */
  semantic?: {
    lexicalScore: number;
    clusterScore: number;
    vectorScore: number;
    totalScore: number;
  };
}

/** Response envelope for GET /api/internal-links */
export interface SuggestionsResponse {
  slug: string;
  locale: string;
  suggestions: LinkSuggestion[];
}

/** Request body for POST /api/internal-links/apply */
export interface ApplyLinkBody {
  /** Source post slug */
  sourceSlug: string;
  /** Absolute file path to the source markdown file */
  filePath: string;
  /** The keyword text to anchor */
  keyword: string;
  /** The target URL (e.g. https://juan-tech.com/tech-seo/big-o) */
  targetUrl: string;
  /** Line number where the replacement should occur */
  lineNumber: number;
}

/** Response for POST /api/internal-links/apply */
export interface ApplyLinkResponse {
  success: boolean;
  /** Human-readable result message */
  message: string;
  /** Error detail when success=false */
  error?: string;
}
