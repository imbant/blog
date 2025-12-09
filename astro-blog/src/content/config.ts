import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    mathjax: z.boolean().optional(),
    toc: z.boolean().optional(),
    comments: z.boolean().optional().default(true),
  }),
});

export const collections = { blog };