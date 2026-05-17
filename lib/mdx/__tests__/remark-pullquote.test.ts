import { describe, expect, it } from "vitest";
import { remark } from "remark";
import remarkHtml from "remark-html";
import { remarkPullquote } from "../remark-pullquote";

async function render(md: string): Promise<string> {
  const file = await remark()
    .use(remarkPullquote)
    .use(remarkHtml, { sanitize: false })
    .process(md);
  return String(file).trim();
}

describe("remarkPullquote", () => {
  it("wraps `>>> body` in blockquote.pullquote", async () => {
    const html = await render(">>> the quoted line.");
    expect(html).toContain('<blockquote class="pullquote">');
    expect(html).toContain('<div class="body">the quoted line.</div>');
    expect(html).not.toContain('class="src"');
  });

  it("attaches source after ::", async () => {
    const html = await render(">>> body line :: — the source");
    expect(html).toContain('<span class="src">— the source</span>');
    expect(html).toContain('<div class="body">body line</div>');
  });

  it("folds multi-line `>>>` blocks", async () => {
    const html = await render(">>> first line\n>>> second line :: src");
    expect(html).toContain("first line second line");
  });

  it("renders *italics* inside body", async () => {
    const html = await render(">>> the *real* point.");
    expect(html).toContain("<em>real</em>");
  });

  it("leaves regular paragraphs alone", async () => {
    const html = await render("Just a paragraph.");
    expect(html).not.toContain("pullquote");
  });
});
