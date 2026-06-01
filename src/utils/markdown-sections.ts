import {
  MarkdownSection,
  UpsertSectionOptions,
  UpsertResult,
} from '../types/section';

/** Strip leading ATX `#`s and surrounding whitespace from a heading string. */
function headingText(heading: string): string {
  return heading.replace(/^\s*#{1,6}\s+/, '').replace(/\s+$/, '');
}

/**
 * Compare two heading strings for an exact match, ignoring only trailing
 * whitespace on either side (and the leading `#`s, so `"Status"` matches a
 * `"## Status"` heading). Inner spacing, casing, and punctuation are
 * significant.
 */
function headingsMatch(a: string, b: string): boolean {
  return headingText(a) === headingText(b);
}

/**
 * Split markdown into sections by ATX heading.
 *
 * A section is a heading line plus everything beneath it, down to (but not
 * including) the next heading of equal-or-higher level — so a `##` section owns
 * its nested `###` children, while a sibling `##` starts a new section. Content
 * before the first heading is returned as a leading section with `level: 0`.
 * Headings inside fenced code blocks (` ``` ` or `~~~`) are ignored.
 */
export function splitSections(markdown: string): MarkdownSection[] {
  const lines = markdown.split('\n');
  const sections: MarkdownSection[] = [];
  let current: MarkdownSection | null = null;
  let fence: string | null = null;

  for (const line of lines) {
    // Toggle fenced-code state on lines that open/close a ``` or ~~~ block.
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (!fence) {
        fence = marker;
      } else if (marker === fence) {
        fence = null;
      }
    }

    const heading = fence ? null : line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (heading) {
      if (current) sections.push(current);
      current = {
        level: heading[1].length,
        heading: heading[2],
        headingLine: line,
        body: [],
      };
    } else if (current) {
      current.body.push(line);
    } else {
      // Preamble before the first heading.
      current = { level: 0, heading: '', headingLine: null, body: [line] };
    }
  }
  if (current) sections.push(current);
  return sections;
}

/**
 * Re-emit sections to a single markdown string. Each section is rendered as a
 * block (heading line + body) with its trailing blank lines trimmed, and the
 * blocks are rejoined with exactly one blank line between them — so a heading
 * always has a clean blank-line separator above it regardless of what the
 * replaced body looked like. Internal blank runs are collapsed to a single
 * blank line.
 */
export function serializeSections(sections: MarkdownSection[]): string {
  const blocks = sections
    .map((s) => {
      const lines = s.headingLine ? [s.headingLine, ...s.body] : s.body;
      return lines.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '');
    })
    .filter((b) => b.length > 0);
  return blocks.join('\n\n') + '\n';
}

/**
 * Replace the body of the section whose heading matches `heading`, or append a
 * new section if none matches.
 *
 * Matching is exact aside from trailing whitespace (see {@link headingsMatch}).
 * If more than one section matches, the operation is refused and the document
 * is left untouched (`{ ok: false, error: 'ambiguous' }`) — the caller should
 * resolve the duplicate headings first.
 *
 * When inserting, the heading is written at `opts.level` (default `2`). When
 * replacing, the existing heading line is preserved verbatim and only the body
 * beneath it changes.
 */
export function upsertSection(
  markdown: string,
  opts: UpsertSectionOptions,
): UpsertResult {
  const { heading, body, level = 2 } = opts;
  const sections = splitSections(markdown);

  const matches = sections.filter(
    (s) => s.level > 0 && headingsMatch(s.heading, heading),
  );
  if (matches.length > 1) {
    return { ok: false, error: 'ambiguous', count: matches.length };
  }

  // A blank line under the heading keeps the body as a distinct paragraph.
  const newBody = ['', ...body.split('\n')];

  if (matches.length === 0) {
    const headingLine = `${'#'.repeat(level)} ${headingText(heading)}`;
    sections.push({ level, heading: headingText(heading), headingLine, body: newBody });
    return { ok: true, markdown: serializeSections(sections), action: 'inserted' };
  }

  const target = matches[0];
  const rewritten = sections.map((s) =>
    s === target ? { ...s, body: newBody } : s,
  );
  return { ok: true, markdown: serializeSections(rewritten), action: 'replaced' };
}
