import { describe, it, expect } from "vitest";
import { postBaseSchema, heroTints, statuses } from "../post-schema";

describe("postBaseSchema", () => {
  it("accepts a minimal valid musing frontmatter", () => {
    const ok = postBaseSchema.safeParse({
      title: "x",
      dek: "y",
      publishedAt: "2026-05-01",
      number: 1,
      tags: [],
      body: "# hi",
      raw: "raw",
      slug: "x",
      path: "musings/x.mdx",
    });
    expect(ok.success).toBe(true);
  });

  it("rejects a bad heroTint", () => {
    const bad = postBaseSchema.safeParse({
      title: "x",
      dek: "y",
      publishedAt: "2026-05-01",
      number: 1,
      tags: [],
      heroTint: "fuchsia",
      body: "x",
      raw: "x",
      slug: "x",
      path: "x.mdx",
    });
    expect(bad.success).toBe(false);
  });

  it("exports heroTints and statuses as readonly tuples", () => {
    expect(heroTints).toContain("sage");
    expect(statuses).toContain("published");
  });
});
