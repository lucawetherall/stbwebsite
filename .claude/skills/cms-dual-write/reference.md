# Dual-write reference — Zod ↔ Sveltia widget mapping

Source of truth on each side: `src/content.config.ts` (build) and `public/admin/config.yml`
(editor). The mappings below are the pairings this repo actually uses.

| Zod (content.config.ts) | Sveltia widget (config.yml) |
|---|---|
| `z.string()` | `widget: string` (single line) or `widget: text` (multi-line summary) |
| `z.string().optional()` | same widget + `required: false` |
| `z.coerce.date()` | `widget: datetime, format: 'YYYY-MM-DD', date_format: 'YYYY-MM-DD', time_format: false, picker_utc: true` |
| `z.boolean().default(false)` | `widget: boolean, default: false` |
| `z.number()` / `.optional()` | `widget: number` (+ `required: false`) |
| image path `z.string().optional()` | `widget: image, required: false` (media folder per collection) |
| PDF/file path `z.string()` | `widget: file` |
| `z.array(z.object({...}))` | `widget: list` with nested `fields:` |
| nested `z.object({...})` | `widget: object` with nested `fields:` |
| markdown body (no schema field) | `widget: markdown, modes: [rich_text]` with the constrained `buttons:` list — keep the button set limited (bold, italic, link, headings, lists, quote) |
| `legacySlug: z.string().optional()` | `{ name: legacySlug, widget: hidden }` — never remove |

## Worked example — adding an optional field to `events`

Say the parish wants a "Booking link label" on special services. Both diffs, same commit:

**`src/content.config.ts`** (the `events` collection):

```ts
 const events = defineCollection({
   loader: glob({ pattern: '**/*.json', base: './src/content/events' }),
   schema: z.object({
     title: z.string(),
     start: z.coerce.date(),
     end: z.coerce.date().optional(),
     location: z.string().optional(),
     description: z.string().optional(),
     url: z.string().optional(),
+    urlLabel: z.string().optional(),
   }),
 });
```

**`public/admin/config.yml`** (the `events` collection's `fields:`), next to `url`:

```yaml
+      - { name: urlLabel, label: 'Link button wording', widget: string, required: false,
+          hint: 'e.g. "Book a place" — leave empty for the standard wording.' }
```

Optional field → no content migration needed. Then `/verify` and a local CMS round-trip.

## Skeleton — registering a brand-new collection

1. **`src/content.config.ts`**: `defineCollection` with a `glob` loader over
   `./src/content/<name>` and a Zod schema; add it to the exported `collections` object.
2. **`public/admin/config.yml`**: a new `- name: <name>` entry with `folder:`, `create: true`,
   `extension:`/`format:`, a friendly `label`/`description`, a `summary:` template, and
   `fields:` mapped per the table above. Place it in the right divider group (*Everyday* /
   *Now & then* / *Set up once*) and set a per-collection `media_folder` if uploads belong
   somewhere specific (staff photos → `public/images/staff`, documents → `public/documents`).
3. Seed at least one real content file so the collection renders and the editor sees an example.
4. Consume it via `getCollection('<name>')`; keep the rendering template developer-owned.
5. `/verify` + CMS round-trip.
