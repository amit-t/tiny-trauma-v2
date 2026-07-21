/**
 * Central site configuration.
 *
 * Everything here changes independently of markup — domain moves, the
 * newsletter provider changes, the contact address changes — so it lives
 * in one module rather than inline in components.
 */

/** Canonical origin. Used for metadata, sitemap, robots and the RSS feed. */
export const SITE_URL = "https://tinytrauma.com";

export const SITE_NAME = "Tiny Trauma";

export const SITE_TITLE = "Tiny Trauma — daily friction, mostly";

export const SITE_DESCRIPTION =
  "A personal blog about the small daily friction between who you are and everything around you. Honest, slightly literary, sometimes funny, occasionally devastating, never a wellness tip.";

/** Where "write back" and unsubscribe-gone-wrong mail should land. */
export const CONTACT_EMAIL = "hi@tinytrauma.com";

/**
 * The newsletter lives on Substack. The site is a static export with no
 * runtime, so there is no first-party subscribe endpoint — every subscribe
 * affordance is a plain link to this URL.
 */
export const NEWSLETTER_URL = "https://tinytrauma.substack.com/subscribe";
