export type PostType = "musing" | "short";

export type ChipTint = "lavender" | "sage" | "butter" | "peach" | "slate";

export type ChipTag = {
  label: string;
  tint: ChipTint;
};

export type CardTint = "musing" | "short" | "bangal" | "phones" | "grief";

export type BasePost = {
  slug: string;
  type: PostType;
  /** Title may contain `*em*` for italics. */
  title: string;
  /** Standfirst / summary. May contain `*em*`. */
  dek: string;
  /**
   * Lightly-marked body string. Recognised tokens:
   *   - blank line                              → paragraph break
   *   - `## ` at line start                     → h2
   *   - `==text==`                              → HandInline
   *   - `[[ aside ]]`                           → HandAside (own paragraph)
   *   - `>>> body :: source`                    → PullQuote (source optional)
   *   - `...`                                   → dingbat (shorts only)
   *   - `-- end` / `-- fin`                     → end mark
   *   - `*italic*`                              → <em>
   */
  body: string;
  tags: ChipTag[];
  number: number;
  publishedAt: Date;
  featured?: boolean;
  /** Tint for the card art-slot on lists/home (musings). */
  cardTint?: CardTint;
  /** Tint for the cover-card on shorts list. */
  coverColor?: "a" | "b" | "c" | "d" | "e" | "f";
  readingTimeMinutes: number;
  /** Shorts only. */
  wordCount?: number;
};

export type PastLetter = {
  number: number;
  date: string;
  /** Slug of the musing it corresponds to. */
  musingSlug: string;
  opens: number;
  summary: string;
};

export type CurrentlyBlock = {
  reading: string;
  writing: string;
  noticing: string;
};
