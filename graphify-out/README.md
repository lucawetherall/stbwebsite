# Codebase Knowledge Graph

This directory contains a persistent knowledge graph of the St Barnabas website codebase, built by graphify. Use it to understand architecture, trace dependencies, and navigate the project without reading individual files.

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

- **God nodes:** `Site`, `civilFromDateOnly()`, `toIcs()`, `baseEvent()`, `toSiteEvent()`
- **Architecture:** 455 nodes, 819 edges, 33 communities (Liturgical Engine, Components & Layouts, Content & Pages, Utilities & Lib, etc.)
- **Cohesion gaps:** Utilities & Lib is weakly interconnected (0.06) — may benefit from refactoring into smaller modules.
- **Isolated nodes:** 142 nodes with ≤1 connection — suggests documentation gaps or missing edges.

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
