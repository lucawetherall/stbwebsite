# Codebase & Content Knowledge Graph

A knowledge graph of the St Barnabas website — **code AND content** — built by graphify. Use it
to trace dependencies, find who/what a decision or entity connects to, and orient yourself before
a cross-cutting change, without reading 367 files.

1103 nodes, 1513 edges, 123 communities. 462 nodes came from deterministic AST extraction of the
TypeScript/Astro code; 652 came from an LLM semantic pass over `docs/**`, the root docs
(`CLAUDE.md`, `DECISIONS.md`, `README.md`, `CMS-SETUP.md`, `docs/AGENT-GUARDRAILS.md`,
`docs/ROADMAP.md`, `docs/superpowers/**`), and every file in `src/content/history/`,
`src/content/news/` (129 posts) and `src/content/pages/**`.

## Scope — what this graph covers and doesn't

- **In scope:** `src/`, `docs/`, `scripts/`, and the root-level docs — i.e. code, content, and
  decision records.
- **Out of scope:** `public/` (mostly binary image uploads), `.claude/`, `.github/`. No images or
  PDFs were run through vision extraction. Re-run `/graphify` on those paths specifically if you
  need them.
- **Snapshot, not live:** taken at the commit that added it. Re-run `/graphify --update` after a
  refactor or a batch of new news posts — don't assume it reflects the current tree.

## Files

- **graph.json** — queryable graph data. Used by `/graphify query`.
- **GRAPH_REPORT.md** — audit report: god nodes, surprising connections, hyperedges, communities.
- **graph.html** — interactive visualization. Open in any browser.
- **manifest.json** — extraction manifest (cache state for incremental `--update` runs).
- **cost.json** — run history. `input_tokens`/`output_tokens` read 0 because this graph was built
  with Claude Code subagents (Task-tool extraction), not graphify's own Gemini/API backend, which
  is the only path this field tracks. The subagents themselves used roughly 1.1M tokens across the
  9 extraction agents — real cost, just not the kind this file counts.

## Using the graph

```bash
/graphify query "How does Site connect to the events architecture?"
/graphify query "What decisions reference the events architecture?"
/graphify path "toIcs" "SiteEvent"
/graphify explain "civilFromDateOnly"
```

## What to trust, and how much

**Solid — deterministic AST, or an LLM reading one page and citing it directly:**
- Hub functions: `Site` (18 edges), `civilFromDateOnly()` (12), `toIcs()` (12), `baseEvent()` (10)
  — the events/iCal and date machinery is still the most-connected code.
- Content hubs: "The events architecture (July 2026)" and "Housing, Living Wages, Mental Health &
  SEN for Ealing" both surfaced as top-10 hub nodes on genuine cross-file reference density, not
  an artefact.
- Hyperedges (§"Hyperedges" in the report) are the most reliable multi-node findings — e.g. the
  2011 organ rebuild team (Hazel Baker, John Hudson, Paul Joslin, Hugh Mather, Nicholson & Co.),
  the three-typeface system, the events-architecture file group. Each cites its source file.

**Weaker — read before acting on it:**
- **Community labels are a programmatic heuristic** (classified by node-ID path prefix, not by an
  LLM reading each community), so **64 of the 123 communities — mostly individual news posts that
  didn't cross-link to others — are all labelled "News & Notices Archive."** That's an honest
  reflection of low connectivity between old news posts, not a sign the labelling failed; but it
  means the label is nearly useless for distinguishing one news community from another. Use
  `graphify explain` on a specific node instead of trusting the bucket label.
- **407 "isolated nodes"** is reported as a knowledge gap; most are `package.json`/`tsconfig` keys
  and single-mention people/entities in a news post with nothing else in that chunk to link to —
  not necessarily undocumented components.
- The report's "cohesion 0.05 → split Utilities & Data?" prompts are generated from a clustering
  score, not a reviewed recommendation.

**Known integrity issue — the health check found this, it's real, not resolved:**
- 77 dangling-endpoint edges and 115 collapsed same-endpoint edge groups, mostly duplicate
  `imports_from` edges the AST pass already had (semantic extraction sometimes re-derived the same
  import edge in a different chunk) and a handful of semantic edges referencing an entity ID that
  didn't get its own node (an entity mentioned in one file but only given a node in another
  chunk's fragment). The graph still builds and is usable; a small number of edges point at gaps.
  Run `/graphify --cluster-only` after a `--force` re-extract if this needs tightening.
- The AST pass also logged 59 `.astro` files with partial parse errors and 72 source files that
  produced zero code nodes (mostly `.json` config/data files with no extractable symbols) — see
  the AST warnings in the build log, not reproduced here.

For the full report, see GRAPH_REPORT.md.

## Updating the graph

```bash
/graphify --update        # re-extract only new/changed files
/graphify --cluster-only  # rerun clustering on the existing graph
```

## See also

- CLAUDE.md — agent guardrails and editability contract
- docs/ROADMAP.md — project backlog
