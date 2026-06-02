import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

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

const events = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    start: z.coerce.date(),
    end: z.coerce.date().optional(),
    location: z.string().optional(),
    description: z.string().optional(),
    url: z.string().optional(),
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

export const collections = { pages, news, services, events, staff, documents };
