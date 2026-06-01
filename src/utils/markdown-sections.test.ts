import { describe, it, expect } from 'bun:test';
import {
  splitSections,
  serializeSections,
  upsertSection,
} from '../index';

describe('splitSections', () => {
  it('splits by ATX heading and captures bodies', () => {
    const md = '# A\n\nalpha\n\n## B\n\nbeta';
    const sections = splitSections(md);
    expect(sections.map((s) => s.heading)).toEqual(['A', 'B']);
    expect(sections[0].level).toBe(1);
    expect(sections[1].level).toBe(2);
    expect(sections[1].body.join('\n')).toContain('beta');
  });

  it('returns pre-heading content as a level-0 preamble', () => {
    const md = 'intro line\n\n## First\n\nbody';
    const sections = splitSections(md);
    expect(sections[0].level).toBe(0);
    expect(sections[0].headingLine).toBeNull();
    expect(sections[0].body.join('\n')).toContain('intro line');
  });

  it('ignores headings inside fenced code blocks', () => {
    const md = '## Real\n\n```sh\n# not a heading\necho hi\n```\n\nmore';
    const sections = splitSections(md);
    expect(sections.map((s) => s.heading)).toEqual(['Real']);
  });

  it('treats a nested deeper heading as part of the parent section', () => {
    const md = '## Parent\n\ntop\n\n### Child\n\nnested\n\n## Sibling\n\nx';
    const sections = splitSections(md);
    // Parent + Child + Sibling are each their own section, but the Parent's
    // body stops at the Child heading.
    expect(sections.map((s) => s.heading)).toEqual([
      'Parent',
      'Child',
      'Sibling',
    ]);
  });
});

describe('upsertSection', () => {
  it('replaces an existing section body in place', () => {
    const md = '## Status\n\nold status\n\n## Notes\n\nkeep me';
    const result = upsertSection(md, { heading: 'Status', body: 'new status' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.action).toBe('replaced');
    expect(result.markdown).toContain('new status');
    expect(result.markdown).not.toContain('old status');
    expect(result.markdown).toContain('keep me');
    // Position preserved: Status still precedes Notes.
    expect(result.markdown.indexOf('Status')).toBeLessThan(
      result.markdown.indexOf('Notes'),
    );
  });

  it('appends a new section when the heading is absent', () => {
    const md = '## Status\n\nstuff';
    const result = upsertSection(md, { heading: 'Follow-ups', body: 'do x' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.action).toBe('inserted');
    expect(result.markdown).toContain('## Follow-ups');
    expect(result.markdown).toContain('do x');
  });

  it('refuses to act when the heading matches more than one section', () => {
    const md = '## Status\n\none\n\n## Status\n\ntwo';
    const result = upsertSection(md, { heading: 'Status', body: 'three' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('ambiguous');
    expect(result.count).toBe(2);
  });

  it('matches ignoring leading #s and trailing whitespace only', () => {
    const md = '## Status   \n\nold';
    // Caller passes the bare word with trailing spaces; should still match.
    const result = upsertSection(md, { heading: 'Status  ', body: 'new' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.action).toBe('replaced');
    expect(result.markdown).toContain('new');
  });

  it('does NOT match on differing inner text or casing', () => {
    const md = '## Status update\n\nold';
    const result = upsertSection(md, { heading: 'Status', body: 'new' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // "Status" != "Status update" → inserted as a new section, original kept.
    expect(result.action).toBe('inserted');
    expect(result.markdown).toContain('## Status update');
    expect(result.markdown).toContain('old');
    expect(result.markdown).toContain('## Status');
  });

  it('preserves the original heading line verbatim on replace', () => {
    const md = '## Status — paste-to-open shipped\n\nold';
    const result = upsertSection(md, {
      heading: 'Status — paste-to-open shipped',
      body: 'new',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.markdown).toContain('## Status — paste-to-open shipped');
    expect(result.markdown).toContain('new');
  });

  it('inserts at the requested heading level', () => {
    const md = '## A\n\nx';
    const result = upsertSection(md, { heading: 'B', body: 'y', level: 3 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.markdown).toContain('### B');
  });

  it('keeps a blank line between a replaced section and the next heading', () => {
    const md = '## A\n\nold a\n\n## B\n\nbody b';
    const result = upsertSection(md, { heading: 'A', body: 'new a' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // The replaced body must not run straight into the next heading.
    expect(result.markdown).not.toMatch(/new a\n## B/);
    expect(result.markdown).toMatch(/new a\n\n## B/);
  });
});

describe('serializeSections', () => {
  it('round-trips a split document', () => {
    const md = '## A\n\nalpha\n\n## B\n\nbeta';
    const round = serializeSections(splitSections(md));
    expect(round).toContain('## A');
    expect(round).toContain('alpha');
    expect(round).toContain('## B');
    expect(round).toContain('beta');
  });
});
