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
  output: "standalone",
};

export default nextConfig;
