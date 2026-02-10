/**
 * Type definitions for the internal linking system.
 * 
 * This module defines the core data structures used throughout the internal linking
 * automation process, including post metadata, keyword matching, and linking configuration.
 */

/**
 * Metadata extracted from a blog post.
 */
export interface PostMetadata {
    /** URL slug of the post */
    slug: string;
    /** Post title */
    title: string;
    /** Primary keywords that this post "owns" */
    primary_keywords: string[];
    /** Related semantic keywords for contextual relevance */
    semantic_keywords?: string[];
    /** Category/pillar the post belongs to */
    category: string;
    /** Absolute file path to the markdown file */
    filePath: string;
    /** URL path for linking (e.g., /tech-seo/guide) */
    url: string;
}

/**
 * A keyword and its semantic variations.
 */
export interface KeywordMatch {
    /** Primary keyword */
    keyword: string;
    /** Semantic variations (plural, singular, case variations) */
    variations: string[];
    /** Target post this keyword should link to */
    targetPost: PostMetadata;
    /** Priority/relevance score (higher = more important) */
    priority: number;
}

/**
 * An opportunity to create an internal link.
 */
export interface LinkOpportunity {
    /** Source post where the link will be inserted */
    sourcePost: PostMetadata;
    /** Target post to link to */
    targetPost: PostMetadata;
    /** Matched keyword text */
    keyword: string;
    /** Surrounding context (for relevance checking) */
    context: string;
    /** Line number in the source file */
    lineNumber: number;
    /** Relevance score (0-1) */
    relevance: number;
}

/**
 * Configuration options for the linking process.
 */
export interface LinkingConfig {
    /** Maximum number of links per keyword per post */
    maxLinksPerKeyword: number;
    /** Minimum word length to consider for linking */
    minWordLength: number;
    /** Patterns to exclude from linking (e.g., code blocks, headings) */
    excludePatterns: RegExp[];
    /** Whether to run in dry-run mode (no file modifications) */
    dryRun: boolean;
    /** Category to process (undefined = all categories) */
    category?: string;
    /** Enable verbose logging */
    verbose: boolean;
}

/**
 * Result of a linking operation.
 */
export interface LinkingResult {
    /** Total number of links added */
    linksAdded: number;
    /** Posts that were modified */
    modifiedPosts: string[];
    /** Opportunities that were skipped (with reasons) */
    skipped: Array<{ opportunity: LinkOpportunity; reason: string }>;
    /** Errors encountered during processing */
    errors: Array<{ post: string; error: string }>;
    /** Identified content gaps based on keywords */
    contentGaps: KeywordGap[];
}

/**
 * Represents a keyword gap, where a keyword is mentioned but no dedicated content exists.
 */
export interface KeywordGap {
    keyword: string;
    mentionCount: number;
    mentionedIn: string[];
    category: string;
}

/**
 * Statistics about keyword usage across posts.
 */
export interface KeywordStats {
    totalKeywords: number;
    averagePerPost: number;
    topKeywords: Array<{ keyword: string; count: number }>;
    orphanedKeywords: number; // Keywords found in content but no dedicated post
}
