import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1).optional(),
    published: z.coerce.date(),
    collection: z.enum(['notes', 'essays']),
    tags: z.array(z.string().trim().min(1)).default([])
      .refine((tags) => new Set(tags.map((tag) => tag.toLowerCase())).size === tags.length, 'Tags must be unique'),
    draft: z.boolean().default(false),
  }),
});
export const collections = { blog };
