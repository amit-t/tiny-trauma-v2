// lib/mdx/validate-mdx.mts
//
// CLI:  pnpm exec tsx lib/mdx/validate-mdx.mts <path-to-mdx>
// Exits 0 if the frontmatter matches the project's Zod schema, 1 otherwise.
// Prints any validation issue to stderr.

import { readFileSync } from "node:fs";
import matter from "gray-matter";
import { postBaseSchema } from "./post-schema";

const mdxPath = process.argv[2];
if (!mdxPath) {
  process.stderr.write("usage: tsx validate-mdx.mts <path>\n");
  process.exit(2);
}

const raw = readFileSync(mdxPath, "utf8");
const { data, content } = matter(raw);

// gray-matter parses ISO date frontmatter into a JS Date — coerce back to
// the YYYY-MM-DD string our schema expects.
const normalized: Record<string, unknown> = { ...data };
if (normalized.publishedAt instanceof Date) {
  normalized.publishedAt = normalized.publishedAt.toISOString().slice(0, 10);
}

const parsed = postBaseSchema.safeParse({
  ...normalized,
  body: content,
  raw,
  slug: mdxPath.split("/").pop()!.replace(/\.mdx$/, ""),
  path: mdxPath,
});

if (!parsed.success) {
  for (const issue of parsed.error.issues) {
    process.stderr.write(`${issue.path.join(".")}: ${issue.message}\n`);
  }
  process.exit(1);
}
process.exit(0);
