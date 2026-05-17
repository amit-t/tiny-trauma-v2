import { SKIP, visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Html, Root } from "mdast";

/**
 * `[[aside]] text` at the start of a paragraph → <span class="aside-line">text</span>.
 * The whole paragraph is replaced with a single span styled by .prose .aside-line.
 */
const ASIDE_RE = /^\[\[aside\]\]\s+/;

export const remarkAside: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "paragraph", (node, index, parent) => {
      if (!parent || index === undefined) return;

      const first = node.children[0];
      if (!first || first.type !== "text") return;
      if (!ASIDE_RE.test(first.value)) return;

      // Strip the marker from the first text node, then re-stringify the
      // paragraph contents with simple inline-markdown handling.
      const stripped = { ...node, children: [...node.children] };
      stripped.children[0] = { ...first, value: first.value.replace(ASIDE_RE, "") };

      const inner = stringifyInline(stripped.children);

      const html: Html = {
        type: "html",
        value: `<span class="aside-line">${inner}</span>`,
      };

      parent.children.splice(index, 1, html);
      return [SKIP, index + 1];
    });
  };
};

function stringifyInline(children: unknown[]): string {
  return children
    .map((c) => {
      const n = c as { type: string; value?: string; children?: unknown[] };
      if (n.type === "text") return escapeHtml(n.value ?? "");
      if (n.type === "emphasis") return `<em>${stringifyInline(n.children ?? [])}</em>`;
      if (n.type === "strong")
        return `<strong>${stringifyInline(n.children ?? [])}</strong>`;
      if (n.type === "inlineCode") return `<code>${escapeHtml(n.value ?? "")}</code>`;
      if (n.type === "html") return n.value ?? "";
      if (n.children) return stringifyInline(n.children);
      return "";
    })
    .join("");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
