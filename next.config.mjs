// Velite builds the content manifest before Next.js compiles.
// `dev` triggers watch mode; `build` does a single clean pass.
// The env-flag guard prevents the build from running twice when Next's
// config file is loaded in multiple worker processes.

const isDev = process.argv.includes("dev");
const isBuild = process.argv.includes("build");

if (!process.env.VELITE_STARTED && (isDev || isBuild)) {
  process.env.VELITE_STARTED = "1";
  const { build } = await import("velite");
  await build({ watch: isDev, clean: !isDev, strict: isBuild });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static site: `next build` writes HTML/CSS/JS to `out/` and no
  // Node.js server is involved. There are no request-reading route
  // handlers, no server actions, and no middleware.
  output: "export",

  // Emit `/musings/slug/index.html` rather than `/musings/slug.html`, so a
  // plain file server resolves every route without rewrite rules.
  trailingSlash: true,

  // No image optimisation server exists in a static export.
  images: { unoptimized: true },
};

export default nextConfig;
