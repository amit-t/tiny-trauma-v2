import { musings as allMusingsRaw, shorts as allShortsRaw } from "#site/content";
import type { ChipTint } from "@/lib/types";

// Velite emits plain objects. We export them as-is (sorted) and add small
// helpers so pages don't repeat the published/draft + sort logic.

export type PublicPost = (typeof allMusingsRaw)[number] | (typeof allShortsRaw)[number];

const IS_DEV = process.env.NODE_ENV !== "production";

function sortNewestFirst<T extends { publishedAt: string }>(items: readonly T[]): T[] {
  return [...items].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function getAllMusings() {
  return sortNewestFirst(allMusingsRaw);
}

export function getAllShorts() {
  return sortNewestFirst(allShortsRaw);
}

/** Public lists. Hides drafts in production; includes them in dev. */
export function getPublishedMusings() {
  return getAllMusings().filter((m) => m.status === "published" || IS_DEV);
}

export function getPublishedShorts() {
  return getAllShorts().filter((s) => s.status === "published" || IS_DEV);
}

/** RSS / sitemap — production-only posts. Never includes drafts. */
export function getPublishedForFeeds() {
  const all = [
    ...allMusingsRaw.map((m) => ({ ...m, type: "musing" as const })),
    ...allShortsRaw.map((s) => ({ ...s, type: "short" as const })),
  ].filter((p) => p.status === "published");
  return sortNewestFirst(all);
}

export function findMusing(slug: string) {
  return allMusingsRaw.find((m) => m.slug === slug);
}

export function findShort(slug: string) {
  return allShortsRaw.find((s) => s.slug === slug);
}

/** Used by the admin posts viewer. */
export function getAllPostsForAdmin() {
  const tagged = [
    ...allMusingsRaw.map((m) => ({ ...m, type: "musing" as const })),
    ...allShortsRaw.map((s) => ({ ...s, type: "short" as const })),
  ];
  return sortNewestFirst(tagged);
}

/** Map a tag string to one of the chip tints. */
export function tagToTint(tag: string): ChipTint {
  switch (tag) {
    case "grief":
      return "sage";
    case "phones":
      return "slate";
    case "bangalore":
    case "small humiliations":
    case "love":
      return "peach";
    case "family":
    case "competence":
      return "butter";
    default:
      return "lavender";
  }
}

/**
 * Card art-slot tint class suffix for musings (matches the `card.t-*`
 * variants in globals.css). Falls back to "musing" (lavender).
 */
export function cardTintFromHero(
  heroTint: PublicPost["heroTint"],
): "musing" | "short" | "grief" | "phones" | "bangal" {
  switch (heroTint) {
    case "sage":
      return "grief";
    case "slate":
      return "phones";
    case "peach":
      return "bangal";
    case "butter":
      return "short";
    case "lavender":
    case "none":
    default:
      return "musing";
  }
}

export const IS_DEV_EXPOSED = IS_DEV;
