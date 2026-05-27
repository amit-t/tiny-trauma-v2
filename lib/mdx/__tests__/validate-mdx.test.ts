import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const goodMdx = `---
title: "x"
dek: "y"
publishedAt: 2026-05-01
number: 1
tags: []
heroTint: sage
heroImage: /img/musings/x/hero.png
status: draft
---

body
`;

const badMdx = `---
title: "x"
dek: "y"
publishedAt: 2026-05-01
number: 1
tags: []
heroTint: fuchsia
status: draft
---

body
`;

describe("validate-mdx.mts", () => {
  it("exits 0 on valid frontmatter", () => {
    const dir = mkdtempSync(join(tmpdir(), "vmdx-"));
    const f = join(dir, "ok.mdx");
    writeFileSync(f, goodMdx);
    execFileSync("pnpm", ["exec", "tsx", "lib/mdx/validate-mdx.mts", f], {
      stdio: "pipe",
    });
  });

  it("exits 1 on invalid heroTint", () => {
    const dir = mkdtempSync(join(tmpdir(), "vmdx-"));
    const f = join(dir, "bad.mdx");
    writeFileSync(f, badMdx);
    expect(() =>
      execFileSync("pnpm", ["exec", "tsx", "lib/mdx/validate-mdx.mts", f], {
        stdio: "pipe",
      }),
    ).toThrow();
  });
});
