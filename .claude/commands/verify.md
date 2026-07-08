---
description: Build, type-check and test the site, then print a house-format verification line
allowed-tools: Bash(npm run build), Bash(npx astro check), Bash(npm test)
---

Verify the site is sound before committing or opening a PR. Run these three, in order, and report
the result of each (do not stop at the first failure — run all three so the full picture is clear):

1. `npm run build` — note the **page count** ("Complete! … N page(s) built") and whether there
   were 0 errors.
2. `npx astro check` — note errors / warnings / hints.
3. `npm test` — note how many vitest tests passed.

Then print a single paste-ready line in the house format, e.g.:

> `Build: 169 pages, 0 errors; astro check 0 errors; vitest 59 passed`
>
> (an example — always report the numbers you actually measured)

If anything failed, summarise what broke and where — don't paper over it.

**CMS reminder:** if this change touched a content schema (`src/content.config.ts`) or any content
surface, also confirm the editor side still matches — `public/admin/config.yml` should have the
same fields, so a non-technical editor can still edit it. Flag any drift.
