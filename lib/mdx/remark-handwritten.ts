import { SKIP, visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Parent, Root, Text } from "mdast";

/**
 * `==text==` inside a paragraph → <span class="hand-inline">text</span>.
 * Matches the .hand-inline CSS in globals.css; rendered via dangerouslySetInnerHTML.
 *
 * Multiple matches per node are supported. `==` must be on the same line and
 * non-empty; `===` and longer runs are left alone so they can be used as ATX
 * heading dividers in regular markdown without colliding here.
 */
const HAND_RE = /==([^=\n]+?)==/g;

export const remarkHandwritten: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "text", (node: Text, index, parent) => {
      if (!parent || index === undefined) return;
      const matches = [...node.value.matchAll(HAND_RE)];
      if (matches.length === 0) return;

      const replacement: Parent["children"] = [];
      let cursor = 0;
      for (const m of matches) {
        const start = m.index ?? 0;
        if (start > cursor) {
          replacement.push({ type: "text", value: node.value.slice(cursor, start) });
        }
        replacement.push({
          type: "html",
          value: `<span class="hand-inline">${escapeHtml(m[1])}</span>`,
        });
        cursor = start + m[0].length;
      }
      if (cursor < node.value.length) {
        replacement.push({ type: "text", value: node.value.slice(cursor) });
      }
      parent.children.splice(index, 1, ...replacement);
      return [SKIP, index + replacement.length];
    });
  };
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
