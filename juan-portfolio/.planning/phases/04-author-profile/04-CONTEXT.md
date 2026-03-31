# Phase 4: Author Profile & E-E-A-T - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Create a complete author profile document, populate the Payload author record with real data, and ensure all published posts have the author relationship assigned in the CMS. Goal: strong E-E-A-T signals across the site.

</domain>

<decisions>
## Implementation Decisions

### Personal Data
- **Name:** Juan Carlos Angulo
- **Role:** Ingeniero de Software y Consultor SEO Técnico freelance
- **Experience:** 4 years
- **Education:** Ingeniería en Software + Técnico en Informática
- **Location:** Lima, Perú
- **LinkedIn:** https://www.linkedin.com/in/juancangulo/
- **GitHub:** https://github.com/sve-nnn
- **Services:** Consultoría SEO técnica + Desarrollo web (Next.js, Payload CMS)
- **Avatar:** No photo available — leave avatar field empty for manual upload later

### author-profile.md Document
- Bilingual: ES + EN sections in the same file
- No list of published articles (CMS handles that)
- File path: `content/author-profile.md`
- Sections: Bio (ES + EN), expertise areas, services, education, social links, about this blog

### Payload Author Record Update
- Update the existing author record via Payload MCP (not a new record)
- Populate: bio (ES), name, email (if visible), social links array (LinkedIn + GitHub)
- Avatar: skip for now — user will upload manually

### Post Author Relationships
- Audit all published posts in Payload — find any with no author relationship
- Bulk-assign the Juan Carlos Angulo author record to all posts missing an author
- Use Payload MCP for this operation

### Claude's Discretion
- Exact wording of bio text (ES and EN) — use professional, first-person tone
- Structure of author-profile.md headers
- How to query/update posts without authors in Payload

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Payload MCP — available for querying and updating Users + Posts collections
- `src/collections/Users/index.ts` — author record schema (check what fields exist: bio, social, avatar)
- Author page already live at `/authors/juan-carlos-angulo` and `/en/authors/juan-carlos-angulo`
- Person schema already added in Phase 3 with LinkedIn + GitHub sameAs

### Established Patterns
- Author relationship on posts: `authors` field (array of user IDs) in Posts collection
- Sync system maps `authors: [name]` frontmatter to Payload user IDs (see payloadRepository.ts)
- Author page uses `generatePersonSchema` — already wired in Phase 3

### Integration Points
- `content/author-profile.md` is a new content document (not synced to CMS — it's a reference file in /content)
- Payload Users collection has the author record for Juan Carlos Angulo
- All posts need `authors` field populated in CMS (not just in frontmatter)

</code_context>

<specifics>
## Specific Ideas

- The author bio page must have >300 words — write a genuine professional bio that reflects 4 years of experience in Lima doing SEO + development
- Include expertise areas that match the blog content clusters: Technical SEO, Next.js development, algorithms/CS fundamentals, Payload CMS
- The author-profile.md in /content serves as a reference doc for future LLM content generation and persona consistency

</specifics>

<deferred>
## Deferred Ideas

- Author profile photo upload (manual — user will do this)
- Author page EN meta tags (partially covered in Phase 2 meta audit)
- Adding certifications/credentials to hasCredential in schema (no certifications provided)

</deferred>
