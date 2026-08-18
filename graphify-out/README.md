# Codebase Knowledge Graph

A knowledge graph of the St Barnabas website **code**, built by graphify. Use it to trace
dependencies and orient yourself before a cross-cutting change.

## Scope — what this graph does and does not cover

Read this before relying on it.

- **Covered:** TypeScript/Astro/JS symbols — functions, types, components, and the calls and
  imports between them, extracted deterministically from the AST.
- **NOT covered:** Markdown and content. The semantic (LLM) extraction pass over the ~180
  `.md` files failed mid-run on a session limit, so `src/content/**` (news, history, pages,
  services), `docs/**`, and the root docs (`README.md`, `DECISIONS.md`, `CMS-SETUP.md`,
  `AGENT-GUARDRAILS.md`) contributed **4 nodes in total** — effectively nothing.

So: **absence from this graph is not evidence of absence in the repo.** For content and prose,
read the files, or `src/content.config.ts` for the schemas. To fill the content gap, re-run the
pipeline with a Gemini key set (`GEMINI_API_KEY`) or in a session with headroom.

This is also a **snapshot** taken at the commit that added it — it goes stale as code changes.

## Files

- **graph.json** — queryable graph data (nodes, edges, communities). Used by `/graphify query` to answer questions about the codebase.
- **GRAPH_REPORT.md** — human-readable audit report with god nodes, surprising connections, and suggested questions.
- **graph.html** — interactive visualization. Open in any browser to explore the graph visually.
- **manifest.json** — extraction manifest (cache state for incremental `--update` runs).
- **cost.json** — token usage history across all graph builds.

## Using the graph

For agents:
```bash
/graphify query "How does the Site type connect to components?"
/graphify query "What imports the liturgy module?"
/graphify path "SiteEvent" "EventCategory"
/graphify explain "civilFromDateOnly"
```

For humans: open `graph.html` in a browser to explore visually, or read `GRAPH_REPORT.md` for key insights.

## Key findings

- **Hub functions:** `Site` (18 edges), `civilFromDateOnly()` (12), `toIcs()` (12),
  `baseEvent()` (10), `toSiteEvent()` (9) — the events/iCal and date machinery is the most
  connected part of the codebase.
- **Shape:** 455 nodes, 819 edges, 33 communities.

Two caveats on the report's own analysis:

- **Community labels are heuristic.** They were assigned by keyword-matching the top node names,
  not by reading the code. 20 of the 33 are unlabelled ("Community 14"), and the labelled ones
  may be wrong. Treat them as rough groupings, not as an architectural taxonomy.
- **"142 isolated nodes" is mostly an artefact**, not a finding. Many are `package.json` and
  `tsconfig` keys (`name`, `version`, `type`, `private`) that have nothing to connect to. Do not
  read it as 142 undocumented components.

Likewise the report's "cohesion 0.06 → should Utilities & Lib be split?" is a generated prompt
from a clustering score, not a reviewed recommendation. Don't action it without reading the code.

For the full report, see GRAPH_REPORT.md.

## Updating the graph

To rebuild with new/changed files:
```bash
/graphify --update
```

To rerun clustering without re-extraction:
```bash
/graphify --cluster-only
```

## See also

- CLAUDE.md — agent guardrails and editability contract
- docs/ROADMAP.md — project backlog
