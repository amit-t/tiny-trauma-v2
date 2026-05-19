export async function loadFraunceSliceForIcon(): Promise<{
  italic: ArrayBuffer;
}> {
  // No User-Agent → Google Fonts serves TTF, which Satori (via next/og) can
  // parse directly. With a modern UA we'd get woff2, which Satori rejects.
  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@1,9..144,700&display=swap",
  ).then((r) => r.text());
  const match = css.match(/url\((https:\/\/[^)]+\.(?:ttf|otf|woff))\)/);
  if (!match) throw new Error(`no parseable font url in css: ${css.slice(0, 200)}`);
  const italic = await fetch(match[1]).then((r) => r.arrayBuffer());
  return { italic };
}
