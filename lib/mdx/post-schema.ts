// lib/mdx/post-schema.ts
//
// Shared schema for Tiny Trauma post frontmatter. Imported by
// `velite.config.ts` (which uses the shared enums) and by
// `lib/mdx/validate-mdx.mts` (the standalone validator used by tt-visuals
// before it commits an atomic mdx rewrite).
//
// Deviation from plan: the plan called for using velite's `s` helpers here,
// but several of them (`s.raw()`, `s.path()`, `s.metadata()`) are async and
// depend on velite's build-time context — they fail outside a velite build.
// Using plain `zod` keeps `postBaseSchema` standalone for the validator.
// Velite still uses `s.markdown()` / `s.raw()` / `s.path()` for its own
// `postBase` in `velite.config.ts`; only the enums (`heroTints`, `statuses`)
// are shared.

import { z } from "zod";

export const heroTints = ["lavender", "sage", "butter", "peach", "slate", "none"] as const;
export const statuses = ["draft", "published"] as const;

export const postBaseSchema = z.object({
  title: z.string(),
  dek: z.string(),
  publishedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "must be ISO date YYYY-MM-DD"),
  number: z.number().int().positive(),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  heroTint: z.enum(heroTints).default("none"),
  heroImage: z.string().optional(),
  status: z.enum(statuses).default("draft"),
  body: z.string(),
  raw: z.string(),
  slug: z.string(),
  path: z.string(),
});

export type PostBase = z.infer<typeof postBaseSchema>;
