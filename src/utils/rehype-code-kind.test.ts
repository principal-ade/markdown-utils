import { describe, it, expect } from 'bun:test';
import { rehypeCodeKind } from './rehype-code-kind';

// Minimal hast builders
const code = (props: Record<string, unknown> = {}) => ({
  type: 'element' as const,
  tagName: 'code',
  properties: props,
  children: [{ type: 'text', value: 'x' }],
});
const el = (tagName: string, children: unknown[]) => ({
  type: 'element' as const,
  tagName,
  properties: {},
  children,
});
const root = (children: unknown[]) => ({ type: 'root' as const, children });

describe('rehypeCodeKind', () => {
  it('marks a fenced block (<pre><code>) as not inline', () => {
    const c = code({ className: ['language-ts'] });
    const tree = root([el('pre', [c])]);
    rehypeCodeKind()(tree as never);
    expect(c.properties.dataInline).toBe(false);
  });

  it('marks a bare <code> in a paragraph as inline', () => {
    const c = code();
    const tree = root([el('p', ['text ', c])]);
    rehypeCodeKind()(tree as never);
    expect(c.properties.dataInline).toBe(true);
  });

  it('marks inline code inside a list item as inline', () => {
    const c = code();
    const tree = root([el('ul', [el('li', [c])])]);
    rehypeCodeKind()(tree as never);
    expect(c.properties.dataInline).toBe(true);
  });

  it('handles a code node with no existing properties', () => {
    const c: { type: 'element'; tagName: string; properties?: Record<string, unknown>; children: unknown[] } = {
      type: 'element',
      tagName: 'code',
      children: [{ type: 'text', value: 'x' }],
    };
    const tree = root([el('pre', [c])]);
    rehypeCodeKind()(tree as never);
    expect(c.properties?.dataInline).toBe(false);
  });

  it('leaves non-code elements untouched', () => {
    const p = el('p', ['hello']);
    const tree = root([p]);
    rehypeCodeKind()(tree as never);
    expect((p.properties as Record<string, unknown>).dataInline).toBeUndefined();
  });
});
