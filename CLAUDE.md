# Project instructions — JuanPortfolio

## graphify (default codebase intelligence)

Use **graphify** as the primary way to understand this codebase. Installed as a Claude Code skill (`/graphify`) backed by the `graphifyy` CLI (repo: https://github.com/safishamsi/graphify).

**Rule:** Before exploring the codebase manually (broad Grep/Glob sweeps, reading many files to answer "how does X work", "where is Y", architecture/relationship questions), query the graph first.

- If `graphify-out/` exists, treat the question as a graphify query first:
  - `graphify query "<question>"` — search the graph
  - `graphify explain "<concept>"` — concept + neighbors
  - `graphify path "<A>" "<B>"` — find connections between nodes
- If `graphify-out/` is missing or stale, (re)build with `/graphify .` (full pipeline) or `graphify update .` (incremental, no LLM) after significant changes.
- Targeted single-fact lookups (you already know the file/symbol) can still go straight to Read/Grep — don't over-route trivial checks through the graph.

Outputs live in `graphify-out/` (`graph.json`, `graph.html`, `GRAPH_REPORT.md`). Keep `graphify-out/` out of commits unless intentionally sharing the graph.
