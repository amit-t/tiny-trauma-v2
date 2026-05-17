import { describe, expect, it } from "vitest";
import { remark } from "remark";
import remarkHtml from "remark-html";
import { remarkHandwritten } from "../remark-handwritten";

async function render(md: string): Promise<string> {
  const file = await remark()
    .use(remarkHandwritten)
    .use(remarkHtml, { sanitize: false })
    .process(md);
  return String(file).trim();
}

describe("remarkHandwritten", () => {
  it("wraps ==phrase== as span.hand-inline", async () => {
    const html = await render("A blog about ==the small daily friction== today.");
    expect(html).toContain('<span class="hand-inline">the small daily friction</span>');
  });

  it("handles multiple matches in one line", async () => {
    const html = await render("==first== and ==second== marks.");
    expect(html.match(/hand-inline/g)?.length).toBe(2);
  });

  it("escapes special chars inside the mark", async () => {
    const html = await render("==a & b > c < d== ok.");
    expect(html).toContain('<span class="hand-inline">a &amp; b &gt; c &lt; d</span>');
  });

  it("leaves text without marks unchanged", async () => {
    const html = await render("plain text, nothing to mark.");
    expect(html).not.toContain("hand-inline");
  });

  it("does not match across newlines", async () => {
    const html = await render("==broken\n==pair== ok.");
    // The first `==` opens but the newline stops it; only the second pair matches.
    expect(html.match(/hand-inline/g)?.length).toBe(1);
  });
});
