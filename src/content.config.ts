import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { DEFAULT_EVENT_CATEGORY, EVENT_CATEGORIES } from './data/eventCategories';

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    kicker: z.string().optional(),
    intro: z.string().optional(),
    hero: z.string().optional(),
    heroAlt: z.string().optional(),
    order: z.number().optional(),
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    gallery: z
      .array(z.object({ src: z.string(), alt: z.string() }))
      .optional(),
  }),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    category: z.string().optional(),
    author: z.string().optional(),
    hero: z.string().optional(),
    heroAlt: z.string().optional(),
    legacySlug: z.string().optional(), // original /b/blog-… slug for 301
    draft: z.boolean().default(false),
  }),
});

const services = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/services' }),
  schema: z.object({
    date: z.coerce.date(),
    feast: z.string(),
    offices: z.array(
      z.object({
        time: z.string(), // "10.30am"
        name: z.string(), // "Sung Mass"
        items: z.array(z.object({ label: z.string(), values: z.array(z.string()) })),
      })
    ),
  }),
});

// Special services, concerts and community events shown on What's On (/whats-on).
// Every field beyond title/start is optional or defaulted, so an editor can never publish
// something that fails the build they cannot debug — `main` deploys to production in ~60s.
// Times are free text ("10.30am") to match serviceTimes.json and to avoid the CMS datetime
// widget's UTC picker, which would store an editor's 10.30 in summer as 11.30.
const events = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    start: z.coerce.date(),
    end: z.coerce.date().optional(),
    time: z.string().optional(), // "10.30am" — omit for an all-day event
    endTime: z.string().optional(),
    category: z.enum(EVENT_CATEGORIES).default(DEFAULT_EVENT_CATEGORY),
    location: z.string().optional(),
    description: z.string().optional(),
    url: z.string().optional(),
    urlLabel: z.string().optional(), // "Book a place"
    image: z.string().optional(),
    imageAlt: z.string().optional(), // required on the CMS widget, not here
    repeat: z.enum(['none', 'weekly', 'fortnightly', 'monthly']).default('none'),
    repeatUntil: z.coerce.date().optional(), // omit for an open-ended series
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const staff = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/staff' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    email: z.string().optional(),
    bio: z.string().optional(),
    photo: z.string().optional(),
    photoAlt: z.string().optional(),
    order: z.number().optional(),
  }),
});

const documents = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/documents' }),
  schema: z.object({
    title: z.string(),
    file: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    external: z.boolean().default(false),
    updated: z.coerce.date().optional(),
    order: z.number().optional(),
  }),
});

const history = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/history' }),
  schema: z.object({
    order: z.number(),
    year: z.string(),
    title: z.string(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    imageCaption: z.string().optional(),
    pullquote: z.string().optional(),
    pullquoteAttribution: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { pages, news, services, events, staff, documents, history };
