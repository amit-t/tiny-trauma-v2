import { SKIP, visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Blockquote, Html, Root } from "mdast";

/**
 * `>>> body :: source` at the start of a line → <blockquote class="pullquote">…</blockquote>.
 *
 * CommonMark parses `>>>` as three nested blockquotes containing one paragraph,
 * so we detect that exact shape (outermost blockquote whose only descendant
 * three levels deep is a paragraph) and replace it with raw HTML.
 *
 * Multi-line `>>>` blocks fold into one quote with spaces between lines.
 * `:: source` is optional and lives anywhere in the joined text; the first
 * `::` splits body from source.
 */
export const remarkPullquote: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "blockquote", (node: Blockquote, index, parent) => {
      if (!parent || index === undefined) return;

      // Drill down through exactly three levels of single-blockquote-only nesting.
      let cur: Blockquote = node;
      for (let depth = 1; depth < 3; depth++) {
        if (cur.children.length !== 1) return;
        const only = cur.children[0];
        if (only.type !== "blockquote") return;
        cur = only;
      }

      // Innermost blockquote must contain exactly one paragraph.
      if (cur.children.length !== 1 || cur.children[0].type !== "paragraph") return;
      const paragraph = cur.children[0];

      const flat = stringifyParagraph(paragraph);
      const joined = flat
        .split(/\n+/)
        .map((l) => l.trim())
        .filter(Boolean)
        .join(" ");
      if (!joined) return;

      const [bodyText, srcText] = splitOnce(joined, "::");
      const body = inlineMarkdownToHtml(bodyText.trim());
      const src = srcText ? inlineMarkdownToHtml(srcText.trim()) : null;

      const html: Html = {
        type: "html",
        value: src
          ? `<blockquote class="pullquote"><div class="body">${body}</div><span class="src">${src}</span></blockquote>`
          : `<blockquote class="pullquote"><div class="body">${body}</div></blockquote>`,
      };

      parent.children.splice(index, 1, html);
      return [SKIP, index + 1];
    });
  };
};

function stringifyParagraph(node: { children: unknown[] }): string {
  function walk(n: { type: string; value?: string; children?: unknown[] }): string {
    if (n.type === "text") return n.value ?? "";
    if (n.type === "emphasis" && n.children)
      return `*${(n.children as []).map((c) => walk(c)).join("")}*`;
    if (n.type === "strong" && n.children)
      return `**${(n.children as []).map((c) => walk(c)).join("")}**`;
    if (n.type === "break") return "\n";
    if (n.type === "inlineCode") return `\`${n.value ?? ""}\``;
    if (n.children) return (n.children as []).map((c) => walk(c)).join("");
    return "";
  }
  return walk(node as { type: string; children: unknown[] });
}

function splitOnce(s: string, sep: string): [string, string | undefined] {
  const i = s.indexOf(sep);
  if (i === -1) return [s, undefined];
  return [s.slice(0, i), s.slice(i + sep.length)];
}

function inlineMarkdownToHtml(input: string): string {
  return escapeHtml(input)
    .replace(/==([^=]+?)==/g, '<span class="hand-inline">$1</span>')
    .replace(/\*([^*\n]+?)\*/g, "<em>$1</em>");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
