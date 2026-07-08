# Design specs & implementation plans — archive

Dated **spec + plan** pairs from past feature work. These are **historical records, not current
instructions**: they describe how a feature was designed and built at the time, and may since
have been superseded by later changes. The current truth is always
[CLAUDE.md](../../CLAUDE.md) and [AGENT-GUARDRAILS.md](../AGENT-GUARDRAILS.md), with the code
itself as the final word.

## Index

| Date | Feature | Spec | Plan | Status |
|---|---|---|---|---|
| 2 June 2026 | CMS-editable surface (collections, config.yml, guards) | [spec](specs/2026-06-02-cms-editable-surface-design.md) | [plan](plans/2026-06-02-cms-editable-surface.md) | Shipped |
| 2 June 2026 | CMS branding (Sveltia login, splash, preview styles) | [spec](specs/2026-06-02-cms-branding-design.md) | [plan](plans/2026-06-02-cms-branding.md) | Shipped |
| 2 June 2026 | Mockup CMS deploy (temporary preview URLs) | [spec](specs/2026-06-02-mockup-cms-deploy-design.md) | — | Shipped; **to revert at go-live** (see CMS-SETUP.md) |
| 2 June 2026 | Who's Who detail pages | [spec](specs/2026-06-02-whos-who-detail-pages-design.md) | — (folded into the editable-surface plan) | Shipped |
| 23 June 2026 | Parish history page | [spec](specs/2026-06-23-history-page-design.md) | [plan](plans/2026-06-23-history-page.md) | Shipped |
| 23 June 2026 | Our Musicians page | [spec](specs/2026-06-23-our-musicians-page-design.md) | [plan](plans/2026-06-23-our-musicians-page.md) | Shipped |

## Convention

Future feature work of any size lands here the same way: a design spec in
`specs/YYYY-MM-DD-<slug>-design.md` and (for multi-step work) an implementation plan in
`plans/YYYY-MM-DD-<slug>.md`, written before the code, and added to the index above when the
feature ships. For the improvement backlog itself, see [docs/ROADMAP.md](../ROADMAP.md).
