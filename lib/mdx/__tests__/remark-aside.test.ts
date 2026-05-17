import { describe, expect, it } from "vitest";
import { remark } from "remark";
import remarkHtml from "remark-html";
import { remarkAside } from "../remark-aside";

async function render(md: string): Promise<string> {
  const file = await remark()
    .use(remarkAside)
    .use(remarkHtml, { sanitize: false })
    .process(md);
  return String(file).trim();
}

describe("remarkAside", () => {
  it("turns `[[aside]] text` into span.aside-line", async () => {
    const html = await render("[[aside]] I would like a third theory.");
    expect(html).toBe('<span class="aside-line">I would like a third theory.</span>');
  });

  it("preserves *italics* inside the aside", async () => {
    const html = await render("[[aside]] a small *kinder* theory, please.");
    expect(html).toContain("<em>kinder</em>");
  });

  it("leaves other paragraphs alone", async () => {
    const html = await render("Plain paragraph.\n\n[[aside]] only this one.");
    expect(html).toContain("<p>Plain paragraph.</p>");
    expect(html).toContain('<span class="aside-line">only this one.</span>');
  });

  it("does not match when [[aside]] is mid-sentence", async () => {
    const html = await render("text before [[aside]] in middle is not an aside.");
    expect(html).not.toContain('class="aside-line"');
  });
});
