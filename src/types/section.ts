/**
 * A contiguous slice of a markdown document delimited by an ATX heading.
 *
 * A section is a heading line plus everything beneath it, down to (but not
 * including) the next heading of equal-or-higher level. Content that appears
 * before the first heading is represented as a leading section with `level: 0`,
 * an empty `heading`, and a `null` `headingLine`.
 */
export interface MarkdownSection {
  /** ATX heading depth (1–6). `0` marks the pre-heading preamble. */
  level: number;
  /** Heading text with the leading `#`s stripped. `''` for the preamble. */
  heading: string;
  /** The raw heading line (e.g. `"## Status"`), or `null` for the preamble. */
  headingLine: string | null;
  /** Lines beneath the heading, excluding the heading line itself. */
  body: string[];
}

/** Options for {@link upsertSection}. */
export interface UpsertSectionOptions {
  /**
   * Heading text to match against. Matching is exact except that trailing
   * whitespace on both sides is ignored. The leading `#`s are optional here —
   * `"Status"` and `"## Status"` match the same section.
   */
  heading: string;
  /** Markdown placed beneath the heading, replacing any existing body. */
  body: string;
  /** Heading level used when inserting a brand-new section. Default `2`. */
  level?: number;
}

/**
 * Result of {@link upsertSection}.
 *
 * `ok: true` carries the rewritten document and whether an existing section was
 * replaced or a new one inserted. `ok: false` means the heading matched more
 * than one section, so the operation is refused (the document is never mutated)
 * — the caller should resolve the duplicate headings first.
 */
export type UpsertResult =
  | { ok: true; markdown: string; action: 'replaced' | 'inserted' }
  | { ok: false; error: 'ambiguous'; count: number };
