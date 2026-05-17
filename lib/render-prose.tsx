import { Fragment, type ReactNode } from "react";
import { HandInline } from "@/components/ui/hand-inline";
import { PullQuote } from "@/components/ui/pull-quote";

/**
 * Tiny markdown-like renderer for hand-written body strings (phase 2 only).
 * Phase 4 will switch to MDX/Tiptap output and replace this; the JSX shape
 * the consumer renders (paragraphs, h2, pullquote, aside-line, etc.) is the
 * same in both cases.
 *
 * Block tokens (start of a paragraph, split on blank lines):
 *   ## …               → <h2>
 *   >>> body :: src    → <PullQuote> (source after `::` optional)
 *   [[ … ]]            → handwritten coral line (.prose .aside-line)
 *   ...                → dingbat row (· · ·) — only meaningful inside .short-body
 *   -- end | -- fin    → end-mark / fin
 *   anything else      → <p>
 *
 * Inline tokens (inside any block's text):
 *   ==text==           → <HandInline>
 *   *text*             → <em>
 */

type Variant = "musing" | "short";

export function renderProse(body: string, variant: Variant = "musing"): ReactNode {
  const blocks = body.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return blocks.map((raw, i) => renderBlock(raw.trim(), i, variant));
}

function renderBlock(raw: string, key: number, variant: Variant): ReactNode {
  if (!raw) return null;

  if (raw.startsWith("## ")) {
    return <h2 key={key}>{renderInline(raw.slice(3))}</h2>;
  }

  if (raw.startsWith(">>>")) {
    const inner = raw.slice(3).trim();
    const [bodyText, src] = inner.includes("::")
      ? splitOnce(inner, "::").map((s) => s.trim())
      : [inner, undefined];
    return (
      <PullQuote key={key} source={src ? renderInline(src) : undefined}>
        {renderInline(bodyText)}
      </PullQuote>
    );
  }

  if (raw.startsWith("[[") && raw.endsWith("]]")) {
    const inner = raw.slice(2, -2).trim();
    // .prose .aside-line is a span styled as block, rotated, in Caveat coral.
    return (
      <span key={key} className="aside-line">
        {renderInline(inner)}
      </span>
    );
  }

  if (raw === "...") {
    return (
      <div key={key} className="dingbat">
        · · ·
      </div>
    );
  }

  if (raw === "-- end") {
    return (
      <div key={key} className={variant === "short" ? "end" : "end-mark"}>
        — end.
      </div>
    );
  }

  if (raw === "-- fin") {
    return (
      <div key={key} className="end">
        — fin.
      </div>
    );
  }

  return <p key={key}>{renderInline(raw)}</p>;
}

function splitOnce(s: string, sep: string): [string, string] {
  const idx = s.indexOf(sep);
  if (idx === -1) return [s, ""];
  return [s.slice(0, idx), s.slice(idx + sep.length)];
}

/**
 * Renders inline tokens. Order: handle ==hand== first (outer), then *em*
 * within each non-hand chunk. Plain text falls through.
 */
export function renderInline(input: string): ReactNode {
  const handRe = /==([^=]+)==/g;
  const out: ReactNode[] = [];
  let cursor = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = handRe.exec(input)) !== null) {
    if (match.index > cursor) {
      out.push(
        <Fragment key={`t-${key++}`}>
          {renderEm(input.slice(cursor, match.index), `e-${key}`)}
        </Fragment>,
      );
    }
    out.push(<HandInline key={`h-${key++}`}>{match[1]}</HandInline>);
    cursor = match.index + match[0].length;
  }
  if (cursor < input.length) {
    out.push(
      <Fragment key={`t-${key++}`}>{renderEm(input.slice(cursor), `e-${key}`)}</Fragment>,
    );
  }
  return out;
}

function renderEm(input: string, keyPrefix: string): ReactNode {
  const emRe = /\*([^*\n]+)\*/g;
  const out: ReactNode[] = [];
  let cursor = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = emRe.exec(input)) !== null) {
    if (match.index > cursor) {
      out.push(
        <Fragment key={`${keyPrefix}-t-${key++}`}>
          {input.slice(cursor, match.index)}
        </Fragment>,
      );
    }
    out.push(<em key={`${keyPrefix}-em-${key++}`}>{match[1]}</em>);
    cursor = match.index + match[0].length;
  }
  if (cursor < input.length) {
    out.push(<Fragment key={`${keyPrefix}-t-${key++}`}>{input.slice(cursor)}</Fragment>);
  }
  return out;
}
