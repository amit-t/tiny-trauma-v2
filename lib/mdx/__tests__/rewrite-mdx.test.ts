// lib/mdx/__tests__/rewrite-mdx.test.ts
//
// Regression tests for `bin/lib/tt-visuals/rewrite-mdx.mts`. The reviewer
// caught that the previous output emitted `<video ... />` (self-closing JSX)
// which HTML5 parsers treat as still-open — the next paragraph then nests
// inside <video>. We assert the rewriter emits an explicit close tag and
// lowercase HTML attribute names, AND that the DOM produced from the body
// has the trailing <p> as a SIBLING of <video> rather than a descendant.

import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import {
  writeFileSync,
  readFileSync,
  mkdtempSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Window } from "happy-dom";

const repoRoot = resolve(__dirname, "..", "..", "..");

function makeMdx(body: string): string {
  return `---
title: "rain"
dek: "monsoon"
publishedAt: 2026-05-04
number: 999
tags: []
heroTint: slate
status: draft
---

${body}
`;
}

function makeInstalled(file: string) {
  return {
    type: "musings",
    slug: "rain",
    inline: [file],
  };
}

function runRewriter(mdxBody: string, file: string) {
  const dir = mkdtempSync(join(tmpdir(), "rewrite-mdx-test-"));
  const mdxPath = join(dir, "rain.mdx");
  const installedPath = join(dir, "installed.json");
  writeFileSync(mdxPath, makeMdx(mdxBody));
  writeFileSync(installedPath, JSON.stringify(makeInstalled(file)));
  execFileSync(
    "pnpm",
    [
      "exec",
      "tsx",
      "bin/lib/tt-visuals/rewrite-mdx.mts",
      mdxPath,
      installedPath,
    ],
    { stdio: "pipe", cwd: repoRoot },
  );
  return readFileSync(mdxPath, "utf8");
}

function bodyOf(mdx: string): string {
  // strip frontmatter: text after the second `---` line
  const lines = mdx.split("\n");
  let dashCount = 0;
  let bodyStart = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^---\s*$/.test(lines[i])) {
      dashCount++;
      if (dashCount === 2) {
        bodyStart = i + 1;
        break;
      }
    }
  }
  return lines.slice(bodyStart).join("\n");
}

describe("rewrite-mdx.mts: <video> tag emission", () => {
  it("emits an explicit </video> close tag (not self-closing)", () => {
    if (!existsSync(join(repoRoot, "node_modules", ".bin", "tsx"))) {
      // Repo dependencies not installed — skip in this environment.
      return;
    }
    const out = runRewriter(
      "first paragraph.\n\n[[visual gif: rain]]\n\nnext paragraph.\n",
      "inline-1.gif",
    );
    const body = bodyOf(out);
    expect(body).toContain("</video>");
    expect(body).not.toMatch(/<video[^>]*\/>/);
  });

  it("uses lowercase HTML attribute names (autoplay, playsinline)", () => {
    if (!existsSync(join(repoRoot, "node_modules", ".bin", "tsx"))) {
      return;
    }
    const out = runRewriter(
      "para.\n\n[[visual gif: rain]]\n\nafter.\n",
      "inline-1.gif",
    );
    const body = bodyOf(out);
    expect(body).toContain("autoplay");
    expect(body).toContain("playsinline");
    expect(body).not.toContain("autoPlay");
    expect(body).not.toContain("playsInline");
  });

  it("places the next paragraph as a SIBLING of <video>, not a descendant", () => {
    if (!existsSync(join(repoRoot, "node_modules", ".bin", "tsx"))) {
      return;
    }
    const out = runRewriter(
      "first paragraph.\n\n[[visual gif: rain]]\n\nnext paragraph.\n",
      "inline-1.gif",
    );
    const body = bodyOf(out);
    // Wrap in a container; parse the HTML fragment.
    const window = new Window();
    const document = window.document;
    document.body.innerHTML = `<div id="root">${body.replace(/\n/g, " ")}</div>`;
    const root = document.getElementById("root")!;
    const video = root.querySelector("video");
    expect(video).not.toBeNull();
    // The trailing "next paragraph." text MUST not appear inside <video>'s
    // text content — if it does, the parser nested the following paragraph
    // into <video> because we self-closed it.
    expect(video!.textContent ?? "").not.toContain("next paragraph");
  });
});
