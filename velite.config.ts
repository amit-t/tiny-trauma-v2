import { defineConfig, defineCollection, s } from "velite";
import { remarkHandwritten } from "./lib/mdx/remark-handwritten";
import { remarkPullquote } from "./lib/mdx/remark-pullquote";
import { remarkAside } from "./lib/mdx/remark-aside";

const heroTints = ["lavender", "sage", "butter", "peach", "slate", "none"] as const;
const statuses = ["draft", "published"] as const;

/**
 * Word/reading time are computed at build from the source markdown so the
 * writer never has to set them by hand. Pull from `body` (raw markdown
 * string) rather than the rendered HTML so HTML tags don't inflate counts.
 */
function addReadingTime<T extends { body: string; metadata?: { readingTime?: number } }>(
  data: T,
) {
  const text = data.body.replace(/[`*_>#=\[\]()]/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return {
    ...data,
    wordCount: words,
    readingTimeMinutes: Math.max(1, Math.round(words / 220)),
  };
}

const postBase = {
  title: s.string(),
  dek: s.string(),
  publishedAt: s.isodate(),
  number: s.number().int().positive(),
  tags: s.array(s.string()).default([]),
  featured: s.boolean().default(false),
  heroTint: s.enum(heroTints).default("none"),
  heroImage: s.string().optional(),
  status: s.enum(statuses).default("draft"),
  // Velite bundles its own copy of unified, so its `Pluggable` type differs
  // nominally from the one our plugins import from the top-level `unified`
  // package. Cast to `any` at the boundary; the plugins are runtime-validated
  // by remark when velite processes the markdown.
  body: s
    .markdown({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      remarkPlugins: [remarkPullquote, remarkAside, remarkHandwritten] as any,
    })
    .transform((html) => html),
  raw: s.raw(),
  slug: s.path().transform((p) =>
    p
      .split("/")
      .pop()!
      .replace(/\.mdx$/, ""),
  ),
  path: s.path(),
} as const;

const musings = defineCollection({
  name: "Musing",
  pattern: "musings/**/*.mdx",
  schema: s
    .object({
      ...postBase,
      type: s.literal("musing").default("musing"),
    })
    .transform(addReadingTime),
});

const shorts = defineCollection({
  name: "Short",
  pattern: "shorts/**/*.mdx",
  schema: s
    .object({
      ...postBase,
      type: s.literal("short").default("short"),
    })
    .transform(addReadingTime),
});

export default defineConfig({
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: { musings, shorts },
});
