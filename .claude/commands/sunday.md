---
description: Scaffold a weekly "This Sunday's Music" service sheet (services JSON) to the exact schema
---

Scaffold a Sunday music sheet from: **$ARGUMENTS** (expected: `<YYYY-MM-DD> [feast name]`).

Steps:

1. **Confirm the date and feast.** `$1` is the Sunday date. If `$2` (feast) is omitted, work out
   the feast/season by checking `src/lib/liturgy.ts` for that date, and state what you inferred.
2. **Match the existing convention.** Read one existing file in `src/content/services/` first and
   mirror its shape exactly. The schema (source of truth: `src/content.config.ts`) is:

   ```json
   {
     "date": "$1",
     "feast": "$2",
     "offices": [
       {
         "time": "10.30am",
         "name": "Sung Mass",
         "items": [
           { "label": "Setting", "values": ["Composer, Mass setting"] },
           { "label": "Motet",   "values": ["Composer, Title"] },
           { "label": "Hymns",   "values": ["123", "456"] }
         ]
       }
     ]
   }
   ```

   - The **filename must equal the `date`**: `src/content/services/$1.json`.
   - `offices[]` is each service that day (`time`, `name`, `items[]`); each item is a `label`
     (e.g. "Setting", "Psalm", "Anthem", "Motet", "Hymns") with `values[]`, one entry per line,
     **composer first then a comma** ("Mozart, Ave verum corpus").
3. **Write `src/content/services/$1.json`.** Pre-fill the parish's standing Sunday services as a
   starting point (check `src/content/settings/serviceTimes.json` for the pattern), leaving the
   music values for the user to complete. Use **UK spelling** in labels.
4. Run `/verify` (or at least `npm run build`) to confirm the new file validates against the
   `services` schema.

Note for the user: `ThisSunday` automatically selects the coming Sunday's sheet and falls back to
the standing service times if none exists. This same content is editable by parish staff in
**Sveltia CMS › This Sunday's Music** — this command is just a faster path for an agent at the CLI.
